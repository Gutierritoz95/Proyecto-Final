import View from './View.js';

class MessageView extends View {
  _parentElement = document.querySelector('.results');
  _message = '';

  showMessage(message) {
    this._message = message;
    const markup = this._generateMarkup();
    
    // Remove existing message first
    this.hideMessage();
    
    // Insert message at the top of results container
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
  }

  hideMessage() {
    const existingMessage = document.querySelector('.message-banner');
    if (existingMessage) existingMessage.remove();
  }

  _generateMarkup() {
    return `
      <div class="message-banner" style="
        background-color: #fff3cd;
        color: #856404;
        padding: 12px 20px;
        margin-bottom: 20px;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
      ">
        ${this._message}
      </div>
    `;
  }
}

export default new MessageView();