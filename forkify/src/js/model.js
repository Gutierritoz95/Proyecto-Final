import { RES_PER_PAGE, API_URL } from './config.js';
import { getJSON } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  isUsingLocalData: false, // Nueva propiedad para rastrear si estamos usando datos locales
};

export const loadRecipe = async function (id) {
  try {
    const data = await getJSON(`${API_URL}/get?rId=${id}`);

    const { recipe } = data;
    state.recipe = {
      id: recipe.recipe_id,
      title: recipe.title,
      publisher: recipe.publisher,
      sourceUrl: recipe.source_url,
      image: recipe.image_url,
      servings: recipe.servings || 4, // Default servings if not provided
      cookingTime: recipe.cooking_time || 30, // Default cooking time if not provided
      ingredients: recipe.ingredients.map((ing, index) => {
        // Convert string ingredients to object format
        // Parse the ingredient string to extract quantity, unit, and description
        const parts = ing.trim().split(' ');
        let quantity = null;
        let unit = '';
        let description = ing;

        // Try to extract quantity from first part
        if (parts.length > 0) {
          const firstPart = parts[0];
          // Check if it's a number or fraction
          if (/^[\d\/.]+$/.test(firstPart)) {
            quantity = parseFloat(firstPart) || null;
            if (parts.length > 1) {
              // Check if second part is a unit
              const secondPart = parts[1];
              if (['cup', 'cups', 'tbsp', 'tsp', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'kg', 'ml', 'l'].includes(secondPart.toLowerCase().replace(/[,()]/g, ''))) {
                unit = secondPart.replace(/[,()]/g, '');
                description = parts.slice(2).join(' ');
              } else {
                description = parts.slice(1).join(' ');
              }
            } else {
              description = '';
            }
          }
        }

        return {
          quantity,
          unit: unit || '',
          description: description || ing
        };
      }),
    };
  } catch (err) {
    console.log(`${err} 💥💥💥💥`);
    
    // Try to load from local sample recipes as fallback
    try {
      const localRes = await fetch('./forkify/src/js/data/sampleRecipes.json');
      if (localRes.ok) {
        const localJson = await localRes.json();
        // Find recipe by ID or use first one
        const sample = localJson.recipes.find(r => r.id === id) || localJson.recipes[0];
        
        if (sample) {
          state.recipe = {
            id: sample.id,
            title: sample.title,
            publisher: sample.publisher,
            sourceUrl: sample.source_url,
            image: sample.image_url || sample.image,
            servings: sample.servings,
            cookingTime: sample.cooking_time || sample.cookingTime,
            ingredients: sample.ingredients || []
          };
          return; // Successfully loaded from fallback
        }
      }
    } catch (fallbackErr) {
      console.log('Local fallback also failed:', fallbackErr);
    }
    
    throw err;
  }
};

// Nueva función para verificar disponibilidad de la API
const checkAPIAvailability = async function () {
  try {
    // Intentamos hacer una consulta simple a la API
    await getJSON(`${API_URL}/search?q=pizza`);
    return true; // API disponible
  } catch (err) {
    return false; // API no disponible
  }
};

export const loadAllRecipes = async function() {
  try {
    // Primero verificamos si la API está disponible
    const apiAvailable = await checkAPIAvailability();
    
    if (apiAvailable) {
      // Si la API está disponible, intentamos cargar recetas de diferentes categorías
      state.isUsingLocalData = false;
      const searches = ['pizza', 'pasta', 'chicken', 'salad', 'cake'];
      let allResults = [];
      
      for (const searchTerm of searches) {
        try {
          const data = await getJSON(`${API_URL}/search?q=${searchTerm}`);
          if (data.recipes && data.recipes.length > 0) {
            allResults = allResults.concat(data.recipes.slice(0, 5)); // 5 recetas por categoría
          }
        } catch (err) {
          console.log(`Error loading ${searchTerm} recipes:`, err);
        }
      }
      
      if (allResults.length > 0) {
        state.search.results = allResults.map(rec => ({
          id: rec.recipe_id,
          title: rec.title,
          publisher: rec.publisher,
          image: rec.image_url,
        }));
        state.search.page = 1;
        console.log(`Loaded ${state.search.results.length} recipes from API`);
        return;
      }
    }
    
    // Si la API no está disponible o no devolvió resultados, usar datos locales
    state.isUsingLocalData = true;
    const localRes = await fetch('./forkify/src/js/data/sampleRecipes.json');
    if (!localRes.ok) {
      throw new Error('Could not load sample recipes');
    }
    
    const localJson = await localRes.json();
    
    // Extract recipes array from JSON structure
    const recipesArray = Array.isArray(localJson) ? localJson : localJson.recipes || [];
    
    // Format recipes for search results display
    state.search.query = 'all'; // Indicate we're showing all recipes
    state.search.results = recipesArray.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      image: recipe.image_url || './forkify/src/img/logo.png',
    }));
    state.search.page = 1;
    
    console.log(`Loaded ${state.search.results.length} local recipes as fallback`);
  } catch (err) {
    console.log(`${err} 💥💥💥💥`);
    throw err;
  }
};

export async function loadSearchResults(query) {
  try {
    state.isUsingLocalData = false; // Reset state
    const data = await getJSON(`${API_URL}/search?q=${query}`);

    state.search.query = query;

    state.search.results = data.recipes.map(rec => {
      return {
        id: rec.recipe_id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
      };
    });
    state.search.page = 1;
  } catch (err) {
    // Log the error as requested
    console.log(`${err} 💥💥💥💥`);
    
    // Set local data state
    state.isUsingLocalData = true;

    // Try local fallback (useful when the public API is down)
    try {
      const local = await getJSON('./forkify/src/js/data/sampleRecipes.json');
      const samplesArr = Array.isArray(local.recipes) ? local.recipes : (local.recipe ? [local.recipe] : (Array.isArray(local) ? local : []));
      // Filter samples by query (case-insensitive) — only include those whose title contains the query
      const filtered = samplesArr.filter(r => (r.title || '').toLowerCase().includes(query.toLowerCase()));
      state.search.query = query;
      state.search.results = filtered.map(sample => ({
        id: sample.id || `sample-${Math.random().toString(36).slice(2,8)}`,
        title: sample.title || 'Sample Recipe',
        publisher: sample.publisher || 'Local',
        image: sample.image_url || sample.image || './forkify/src/img/logo.png',
      }));
      state.search.page = 1;
      // If no filtered results, fall back to returning all samples so user sees some data
      if (state.search.results.length === 0) {
        state.search.results = samplesArr.map(sample => ({
          id: sample.id || `sample-${Math.random().toString(36).slice(2,8)}`,
          title: sample.title || 'Sample Recipe',
          publisher: sample.publisher || 'Local',
          image: sample.image_url || sample.image || './forkify/src/img/logo.png',
        }));
      }
      return;
    } catch (localErr) {
      // If local fallback also fails, rethrow original error so controller can handle it
      throw err;
    }
  }
}

export function getSearchResultsPage(page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  return state.search.results.slice(start, end);
}

// quick dev call (comment out in production) — per instructions: test with 'pizza'
// loadSearchResults('pizza');
