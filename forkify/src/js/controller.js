import recipeView from './views/recipeView.js';
import * as model from './model.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import messageView from './views/messageView.js';

const controlPagination = function (goToPage) {
  // 1) Render NEW results
  resultsView.render(model.getSearchResultsPage(goToPage));

  // 2) Render NEW pagination buttons  
  paginationView.render(model.state.search);
};

// --------- Search controller
async function controlSearchResults() {
  try {
    // 1) get query from view
    const query = searchView.getQuery();
    if (!query) return;

    // 2) render spinner in results area (before network)
    resultsView.renderSpinner();

    // 3) load search results
    await model.loadSearchResults(query);

    // 4) Check if we're using local data and show message
    if (model.state.isUsingLocalData) {
      messageView.showMessage('🏠 Mostrando recetas locales - La API no está disponible en este momento');
    } else {
      messageView.hideMessage();
    }

    // 5) render first page results
    const pageResults = model.getSearchResultsPage(1);
    resultsView.render(pageResults);

    // 6) Render pagination buttons
    paginationView.render(model.state.search);

    // For debugging (can be removed)
  } catch (err) {
    console.error(err);
    // show error in results area
    try {
      resultsView.renderError(typeof err.message === 'string' ? err.message : 'Search failed');
    } catch (_) {}
  }
}

const preloadAllRecipes = async function() {
  try {
    // Show spinner while loading
    resultsView.renderSpinner();
    
    // Load all available recipes (API or local)
    await model.loadAllRecipes();
    
    // Check if we're using local data and show message
    if (model.state.isUsingLocalData) {
      messageView.showMessage('🏠 Mostrando recetas locales - La API no está disponible en este momento');
    } else {
      messageView.hideMessage();
    }
    
    // Render all recipes in first page
    const pageResults = model.getSearchResultsPage(1);
    resultsView.render(pageResults);
    
    // Render pagination if needed
    paginationView.render(model.state.search);
    
    console.log('✅ All recipes preloaded successfully!');
  } catch (err) {
    console.error('Error preloading recipes:', err);
    resultsView.renderError('Could not load recipes. Please try refreshing the page.');
  }
};

function init() {
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  // Let the recipe view listen for hashchange and load events and call showRecipe
  recipeView.addHandlerRender(controlRecipes);
  
  // Preload all recipes on app start
  preloadAllRecipes();
}

init();

async function controlRecipes() {
  try {
    const id = window.location.hash.slice(1);
    
    if (!id) return;
    
    recipeView.renderSpinner();
    
    // Check if we're using a sample recipe ID
    const isSampleId = id.startsWith('sample-') || ['23456', '12345'].includes(id);
    
    // Loading recipe
    await model.loadRecipe(id);
    
    // Rendering recipe
    recipeView.render(model.state.recipe);
    
    // Show local indicator if using sample/fallback data
    if (isSampleId) {
      recipeView.showLocalIndicator('Using sample recipe (API unavailable)');
    }
    
  } catch (err) {
    console.log(`${err} 💥💥💥💥`);
    recipeView.renderError?.(`Could not load recipe. ${err.message}`) || console.error('Could not render error');
  }
}


// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////
