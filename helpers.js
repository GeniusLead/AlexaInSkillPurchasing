const { defaultLearnMorePrompts } = require('./models.js');

/**
 * Determines if an upsell should be made
 * @param {object} handlerInput
 * @returns {boolean} True if an upsell should be made
 */
function shouldUpsell(handlerInput) {
  if (handlerInput.requestEnvelope.request.intent === undefined) {
    // If the last intent was Connections.Response, do not upsell
    return false;
  } else {
    // randomize upsell
    return getRandomElement([true, false]);
  }
}

/**
 * Checks if the user is entitled to the in skill product
 * @param {object} product The product to check
 * @returns {boolean} True if the product is entitled
 */
function isEntitled(product) {
  const isObject = product instanceof Object;
  return isObject && product.entitled === 'ENTITLED';
}

/**
 * Returns a random element from an array
 * @param {array} array
 * @returns {*} A random element from the array
 */
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Filters an array of in-skill products by removing any which are not entitled
 * @param {object[]} products An array of in skill products
 * @returns {object[]} An array of entitled products
 */
function getEntitledProducts(products) {
  const entitledProducts = products.filter(
    (record) => record.entitled === 'ENTITLED'
  );
  return entitledProducts;
}

/**
 * Generate a single string with comma separated
 * product names from an array of products
 * @param {object[]} products
 * @returns {string}
 */
function getSpeakableListOfProducts(products) {
  return products
    .map((item) => item.name)
    .join(', ')
    .replace(/,(?=[^,]*$)/, ' and');
}

/**
 * Gets a random 'learn more' prompt
 * @param {string[]} learnMorePrompts An optional list of prompts to select from
 * Default prompts are located in the models.js file
 * @returns {string} A random prompt
 */
function getRandomLearnMorePrompt(learnMorePrompts = defaultLearnMorePrompts) {
  return getRandomElement(learnMorePrompts);
}

/**
 * Gets an in skill product from a list of product with the corresponding reference name
 * @param {object[]} products An array of in-skill products
 * @param {string} productReferenceName The reference name of a product
 * @returns {object} The requested in-skill product
 */
function getProductByReferenceName(products, productReferenceName) {
  const product = products.filter(
    (record) => record.referenceName === productReferenceName
  );
  if (product.length === 1) {
    return product[0];
  } else {
    throw new ReferenceError(
      `No product found with the reference name ${productReferenceName}.`
    );
  }
}

/**
 * Updates the handlerInput's responseBuilder to send a
 * buy request for a specified in-skill product
 * @param {object} handlerInput
 * @param {object} product The product to buy
 * @returns {object} The updated handlerInput
 */
function makeBuyOffer(handlerInput, product) {
  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Buy',
      payload: {
        InSkillProduct: {
          productId: product.productId,
        },
      },
      token: 'correlationToken',
    })
    .getResponse();
}

/**
 * Updates the handlerInput's responseBuilder to send an
 * upsell request for a specified in-skill product
 * @param {object} handlerInput
 * @param {object} product The product to upsell
 * @param {string} preUpsellMessage The message for Alexa to speak before an upsell is made
 * @returns {object} returns The updated handlerInput
 */
function makeUpsell(
  handlerInput,
  product,
  preUpsellMessage,
  learnMorePrompts = ['']
) {
  const upsellMessage = `${preUpsellMessage} ${
    product.summary
  } ${getRandomLearnMorePrompt(learnMorePrompts)}`.trim();

  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Upsell',
      payload: {
        InSkillProduct: {
          productId: product.productId,
        },
        upsellMessage,
      },
      token: 'correlationToken',
    })
    .getResponse();
}

// TODO: complete functions below:
/**
 * Generates a string based on which in-skill product is being purchased
 * @param {string} productReferenceName The reference name of the product
 * @param {string} productName The name of the product
 * @returns {string} The generated string to be spoken by Alexa
 */
/* function getBuyResponseText(productReferenceName, productName) {
  if (productReferenceName === 'Test_Pack') {
    return `With the ${productName}, I can now say hello in a variety of languages.`;
  } else if (productReferenceName === 'Premium_Subscription') {
    return `With the ${productName}, I can now say hello in a variety of languages, in different accents using Amazon Polly.`;
  }
  return "Sorry, that's not a valid product";
}

function getResponseBasedOnAccessType(handlerInput, res, preSpeechText) {
  const testPackProduct = res.products.filter(
    (record) => record.referenceName === 'Test_Pack'
  );
  const premiumSubscriptionProduct = res.products.filter(
    (record) => record.referenceName === 'Premium_Subscription'
  );

  let speechText;
  let cardText;
  let repromptOutput;

  if (isEntitled(premiumSubscriptionProduct)) {
    // Customer has bought the Premium Subscription. Switch to Polly Voice, and return special hello
    // cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    // const randomVoice = getRandomElement(specialGreeting.voice);
    // speechText = `${preGreetingSpeechText} ${switchVoice(langSpecialGreeting, randomVoice)} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    // repromptOutput = `${getRandomYesNoQuestion()}`;
    speechText = 'Premium Subscription';
    repromptOutput = speechText;
  } else if (isEntitled(testPackProduct)) {
    // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
    // cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    // speechText = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    // repromptOutput = `${getRandomYesNoQuestion()}`;
    speechText = 'Test Pack';
    repromptOutput = speechText;
  }  else {
    // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
    const theGreeting = getSimpleHello();
    // Determine if upsell should be made. returns true/false
    if (shouldUpsell(handlerInput)) {
      // Say the simple greeting, and then Upsell Greetings Pack
      speechText = `Here's your simple greeting: ${theGreeting}. By the way, you can now get greetings in more languages.`;
      return makeUpsell(speechText, testPackProduct, handlerInput);
    }

    // Do not make the upsell. Just return Simple Hello Greeting.
    cardText = `Here's your simple greeting: ${theGreeting}.`;
    speechText = `Here's your simple greeting: ${theGreeting}. ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  }

  return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(repromptOutput)
    .getResponse();
} */

module.exports = {
  shouldUpsell,
  isEntitled,
  getRandomElement,
  getEntitledProducts,
  getSpeakableListOfProducts,
  getRandomLearnMorePrompt,
  getProductByReferenceName,
  makeBuyOffer,
  makeUpsell,
  // getResponseBasedOnAccessType,
  // getBuyResponseText,
};
