const Alexa = require("ask-sdk");
const https = require("https");
var request = require('sync-request');

const Custom_Functions = require('./custom_functions.js');
let custom_functions = new Custom_Functions();

const invocationName = custom_functions.getInvocationName();
let skillTitle = capitalize(invocationName);

var lang = custom_functions.getLang()
var limitResults = custom_functions.getLimitResults();

var last_request = {
    'intent' : '',
    'sparql' : '',
    'slots' : {
        'actual_values': {},
        'resolved_values' : {}
    },
    'results' : {},
    'response' : '',
    'success':false
};

function getMemoryAttributes() {   
  const memoryAttributes = {
       "history":[],
       "launchCount":0,
       "lastUseTimestamp":25,
       "lastSpeechOutput":{},
       "nextIntent":[]
   };
   return memoryAttributes;
};

// the # of considered intents
const maxHistorySize = 35;

// 1. Intent Handlers =============================================

const LaunchRequest_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = LanguageManager['LaunchRequest'](lang);

        return responseBuilder
            .speak(say)
            .reprompt(LanguageManager['reprompt'](lang) + say) 
            .withStandardCard(LanguageManager['StandardCard'](lang))
            .getResponse();
    },
};

const AMAZON_CancelIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = LanguageManager['CancelIntent'](lang);

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const AMAZON_HelpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = LanguageManager['HelpIntent'](lang);

        return responseBuilder
            .speak(say)
            .reprompt(LanguageManager['reprompt'](lang) + " " + say)
            .getResponse();
    },
};

const AMAZON_StopIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = LanguageManager['StopIntent'](lang);

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const AMAZON_NavigateHomeIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateHomeIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = LanguageManager['NavigateHomeIntent'](lang);


        return responseBuilder
            .speak(say)
            .reprompt(LanguageManager['reprompt'](lang) + say)
            .getResponse();
    },
};





const getPropertyObject_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getPropertyObject' ;
    },
    handle(handlerInput) {
        console.log("getPropertyObject")

        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        console.log(slotValues)
        
        let slotStatus = '';

        //I expect slot property and entity
        var property='';
        var responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus = responseSlot.slotStatus;

        var entity='';
        responseSlot = resolveSlot(intentName, 'entity', slotValues);
        if(responseSlot.entity!=null)
          entity = responseSlot.entity;
        slotStatus += responseSlot.slotStatus;

        //query execution
        console.log(property);
        var resolved_properties = custom_functions.getProperty(property);
        console.log(resolved_properties);

        console.log(entity);
        var resolved_entities = custom_functions.getEntity(entity);
        console.log(resolved_entities);

        var result_reply = null;

        if(resolved_entities)
          result_reply = getPropertyObjectQuery(resolved_entities, resolved_properties);
        else
          result_reply = getPropertyObjectByLabelQuery(entity, resolved_properties);

        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, entity, property);
        var reply = request_verbalization + " " + result_reply;
        reply += " " +LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'entity':entity,
          'property':property
        };
        storeLastIntent(intentName, parameters);

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getPropertySubject_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getPropertySubject' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot property and entity
        var property='';
        var responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus = responseSlot.slotStatus;

        var entity='';
        responseSlot = resolveSlot(intentName, 'entity', slotValues);
        if(responseSlot.entity!=null)
          entity = responseSlot.entity;
        slotStatus += responseSlot.slotStatus;


        //query execution
        var resolved_entities = custom_functions.getEntity(entity);
        var resolved_properties = custom_functions.getProperty(property);

        var result_reply = null;
        if(resolved_entities)
          result_reply = getPropertySubjectQuery(resolved_entities, resolved_properties);
        else
          result_reply = getPropertySubjectLabelQuery(entity, resolved_properties);
        
        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, entity, property);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'entity':entity,
          'property':property
        };
        storeLastIntent(intentName, parameters);
  
        return responseBuilder
          .speak(reply)
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();
    },
};

const getDescription_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getDescription' ;
    },
    handle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      const responseBuilder = handlerInput.responseBuilder;
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      var intentName = request.intent.name;
      let slotValues = getSlotValues(request.intent.slots); 

      let slotStatus = '';

      //I expect slot entity
      var entity='';
      var responseSlot = resolveSlot(intentName, 'entity', slotValues);
      if(responseSlot.entity!=null)
        entity = responseSlot.entity;
      slotStatus += responseSlot.slotStatus;

      //query execution
      var resolved_entities = custom_functions.getEntity(entity);
      var result_reply = null;

      if(resolved_entities){
        result_reply = getDescriptionQuery(resolved_entities);
      } 
      else{
        result_reply = getDescriptionByLabelQuery(entity);
      }
      //verbalization
      var request_verbalization = LanguageManager[intentName+"_request"](lang, entity);
      var reply = request_verbalization + " " + result_reply;
      reply += " " + LanguageManager["more_questions"](lang);

      //storage last request
      var parameters = {
        'entity':entity
      };
      storeLastIntent(intentName, parameters);

      return responseBuilder
          .speak(reply)
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();
    },
};

const getClassInstances_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getClassInstances' ;
    },
    handle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      const responseBuilder = handlerInput.responseBuilder;
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      var intentName = request.intent.name;
      let slotValues = getSlotValues(request.intent.slots); 

      let slotStatus = '';

      //I expect slot class
      var entity='';
      var responseSlot = resolveSlot(intentName, 'class', slotValues);
      if(responseSlot.class!=null)
        entity = responseSlot.class;
      slotStatus = responseSlot.slotStatus;

      //query execution
      var resolved_entities = custom_functions.getEntity(entity);
      const result_reply = getClassInstancesQuery(resolved_entities);

      //verbalization
      var request_verbalization = LanguageManager[intentName+"_request"](lang, entity);
      var reply = request_verbalization + " " + result_reply;
      reply += " " + LanguageManager["more_questions"](lang);

      //storage last request
      var parameters = {
        'entity':entity,
        'property': 'instance of'
      };
      storeLastIntent(intentName, parameters);


      return responseBuilder
          .speak(reply)
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();
    },
};

const getImg_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getImg' ;
    },
    handle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      const responseBuilder = handlerInput.responseBuilder;
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      var intentName = request.intent.name;
      let slotValues = getSlotValues(request.intent.slots); 

      let slotStatus = '';

      //I expect slot entity
      var entity='';
      var responseSlot = resolveSlot(intentName, 'entity', slotValues);
      if(responseSlot.entity!=null)
        entity = responseSlot.entity;
      slotStatus += responseSlot.slotStatus;

      //query execution
      var resolved_entities = custom_functions.getEntity(entity);
      var image_url = null;
      if(resolved_entities)
       image_url = getImgQuery(resolved_entities);
      else
        image_url = getImgByLabelQuery(entity);

      //verbalization
      var reply = LanguageManager[intentName+"_request"](lang, entity);
      reply += " " + LanguageManager["more_questions"](lang);

      //storage last request
      var parameters = {
        'entity':entity,
        'property':'image'
      };
      storeLastIntent(intentName, parameters);


      var response = "";
      if (supportsDisplay(handlerInput)) {
        const display_type = "BodyTemplate7";
        response = getDisplay(handlerInput.responseBuilder, sessionAttributes, image_url, display_type);

        return response
          .speak(reply)
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();

      }
      else{
        response = handlerInput.responseBuilder;

        return response
          .speak(LanguageManager[intentName+"_unsoppertedDevice"](lang))
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();
      }
      },
};

const getSuperlative_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getSuperlative' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot entity, property and superlative
        var property='';
        var responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus += responseSlot.slotStatus;

        var entity='';
        responseSlot = resolveSlot(intentName, 'entity', slotValues);
        if(responseSlot.entity!=null)
          entity = responseSlot.entity;
        slotStatus += responseSlot.slotStatus;

        var superlative='';
        console.log(slotValues);
        responseSlot = resolveSlot(intentName, 'superlative', slotValues);
        if(responseSlot.superlative!=null)
          superlative = responseSlot.superlative;
        slotStatus += responseSlot.slotStatus;

        //query execution
        var resolved_entities = custom_functions.getEntity(entity);
        var resolved_properties = custom_functions.getProperty(property);

        const result_reply = getSuperlativeQuery(resolved_entities, resolved_properties, superlative);

        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, entity, property, superlative);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'entity':entity,
          'property':property,
          'superlative':superlative
        };
        storeLastIntent(intentName, parameters);

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getTripleVerification_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getTripleVerification' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';
        
        //I expect slot subject, property and object
        var subject='';
        var responseSlot = resolveSlot(intentName, 'subj', slotValues);
        if(responseSlot.subj!=null)
          subject = responseSlot.subj;
        slotStatus += responseSlot.slotStatus;

        var object='';
        responseSlot = resolveSlot(intentName, 'obj', slotValues);
        if(responseSlot.obj!=null)
          object = responseSlot.obj;
        slotStatus += responseSlot.slotStatus;

        var property='';
        responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus += responseSlot.slotStatus;

        //query execution
        var resolved_subjects = custom_functions.getEntity(subject);
        var resolved_properties = custom_functions.getProperty(property);
        var resolved_objects = custom_functions.getEntity(object);

        var result_reply = null;
        if(resolved_subjects && resolved_objects)
            result_reply = getTripleVerificationQuery(resolved_subjects, resolved_properties, resolved_objects);
        else if(resolved_subjects && !resolved_objects)
            result_reply = getTripleVerificationByObjectLabelQuery(resolved_subjects, resolved_properties, object);
        else if(!resolved_subjects && resolved_objects)
           result_reply = getTripleVerificationBySubjectLabelQuery(subject, resolved_properties, resolved_objects);
        else
           result_reply = getTripleVerificationBySubjectAndObjectLabelQuery(subject, resolved_properties, object);

        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, subject, property, object);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'subject': subject,
          'property': property,
          'object' : object
        };
        storeLastIntent(intentName, parameters);

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getNumericFilter_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getNumericFilter' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot property, symbol and value
        var property='';
        var responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus = responseSlot.slotStatus;

        var symbol='';
        responseSlot = resolveSlot(intentName, 'symbol', slotValues);
        if(responseSlot.symbol!=null)
          symbol = responseSlot.symbol;
        slotStatus += responseSlot.slotStatus;

        var value=-1;
        responseSlot = resolveSlot(intentName, 'value', slotValues);
        if(responseSlot.value!=null)
          value = responseSlot.value;
        slotStatus += responseSlot.slotStatus;
        
        //query execution
        var resolved_properties = custom_functions.getProperty(property);
        const result_reply = getNumericFilterQuery(resolved_properties, symbol, value);
        
        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, property, symbol, value);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'property':property,
          'symbol':symbol,
          'value':value
        };
        storeLastIntent(intentName, parameters);

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getNumericFilterByClass_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getNumericFilterByClass' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot class, property, symbol and value
        var entity='';
        var responseSlot = resolveSlot(intentName, 'class', slotValues);
        if(responseSlot.class!=null)
          entity = responseSlot.class;
        slotStatus = responseSlot.slotStatus;

        var property='';
        responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus += responseSlot.slotStatus;

        var symbol='';
        responseSlot = resolveSlot(intentName, 'symbol', slotValues);
        if(responseSlot.symbol!=null)
          symbol = responseSlot.symbol;
        slotStatus += responseSlot.slotStatus;

        var value=-1;
        responseSlot = resolveSlot(intentName, 'value', slotValues);
        if(responseSlot.value!=null)
          value = responseSlot.value;
        slotStatus += responseSlot.slotStatus;
        
        //query execution
        var resolved_entities = custom_functions.getEntity(entity);
        var resolved_properties = custom_functions.getProperty(property);
        const result_reply = getNumericFilterByClassQuery(resolved_entities, resolved_properties, symbol, value);
        
        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, entity, property, symbol, value);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'entity':entity,
          'property':property,
          'symbol':symbol,
          'value':value
        };
        storeLastIntent(intentName, parameters);

        console.log("getNumericFilterByClass_Handler")
        console.log(reply)

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getLocation_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getLocation' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot entity
        var entity='';
        responseSlot = resolveSlot(intentName, 'entity', slotValues);
        if(responseSlot.entity!=null)
          entity = responseSlot.entity;
        slotStatus += responseSlot.slotStatus;

        //query execution
        var resolved_entities = custom_functions.getEntity(entity);

        var result_reply = null;
        if(resolved_entities)
          result_reply = getLocationQuery(resolved_entities);
        else
          result_reply = getLocationByLabelQuery(entity);

        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, entity);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'entity':entity,
          'property':'location'
        };
        storeLastIntent(intentName, parameters);

        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();

    },
};

const getPropertySubjectByClass_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getPropertySubjectByClass' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        var intentName = request.intent.name;
        let slotValues = getSlotValues(request.intent.slots); 

        let slotStatus = '';

        //I expect slot class, property and entity
        var class_value='';
        var responseSlot = resolveSlot(intentName, 'class', slotValues);
        if(responseSlot.class!=null)
          class_value = responseSlot.class;
        slotStatus += responseSlot.slotStatus;

        var property='';
        responseSlot = resolveSlot(intentName, 'property', slotValues);
        if(responseSlot.property!=null)
          property = responseSlot.property;
        slotStatus += responseSlot.slotStatus;
    
        var entity='';
        responseSlot = resolveSlot(intentName, 'entity', slotValues);
        if(responseSlot.entity!=null)
          entity = responseSlot.entity;
        slotStatus += responseSlot.slotStatus;

        //query execution
        var resolved_classes = custom_functions.getEntity(class_value);
        var resolved_properties = custom_functions.getProperty(property);
        var resolved_entities = custom_functions.getEntity(entity);

        var result_reply = null;
        if(resolved_entities)
          result_reply = getPropertySubjectByClassQuery(resolved_classes, resolved_properties, resolved_entities);
        else
          result_reply = getPropertySubjectByClassAndEntityLabelQuery(resolved_classes, resolved_properties, entity);

        //verbalization
        var request_verbalization = LanguageManager[intentName+"_request"](lang, class_value, entity, property);
        var reply = request_verbalization + " " + result_reply;
        reply += " " + LanguageManager["more_questions"](lang);

        //storage last request
        var parameters = {
          'class':class_value,
          'property':property,
          'entity':entity
        };
        storeLastIntent(intentName, parameters);


        return responseBuilder
            .speak(reply)
            .reprompt(LanguageManager["reprompt_more_questions"](lang))
            .getResponse();
    },
};

const getAllResultsPreviousQuery_Handler = {
  canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest' && request.intent.name === 'getAllResultsPreviousQuery' ;
  },
  handle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      const responseBuilder = handlerInput.responseBuilder;
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      /*
        var last_request = {
            'intent' : '',
            'sparql' : '',
            'slots' : {
                'actual_values': {},
                'resolved_values' : {}
            },
            'results' : {},
            'response' : '',
            'success':false
        };
      */
      var results = last_request.results.label;

      var response = '';
      if(Array.isArray(results)){
        var count = results.length;
        response = LanguageManager['results_response'](lang, count, results);
      }
      else {
        response = last_request.response;
      
      }

      var reply = response + " " + LanguageManager["more_questions"](lang)

      return responseBuilder
          .speak(reply)
          .reprompt(LanguageManager["reprompt_more_questions"](lang))
          .getResponse();
  },
};

const SessionEndedHandler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      var reply = LanguageManager['SessionEndedRequest'](lang);
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder
      .speak(reply)
          .getResponse();
    }
};

const ErrorHandler =  {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        var reply = LanguageManager['ErrorHandler'](lang);
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak(reply)
            .reprompt(reply)
            .getResponse();
    }
};

const APP_ID = undefined;  // TODO replace with your Skill ID (OPTIONAL).

// 2.  Helper Functions ===================================================================

function getDisplay(response, attributes, image_url, display_type){
  const image = new Alexa.ImageHelper().addImageInstance(image_url).getImage();
  const current_score = attributes.correctCount;
  let display_score = ""
  console.log("the display type is => " + display_type);

  if (typeof attributes.correctCount !== 'undefined'){
    display_score = "Score: " + current_score;
  }
  else{
    display_score = "Score: 0. Let's get started!";
  }

  const myTextContent = new Alexa.RichTextContentHelper()
  .withPrimaryText('Question #' + (attributes.counter + 1) + "<br/>")
  .withSecondaryText(attributes.lastResult)
  .withTertiaryText("<br/> <font size='4'>" + display_score + "</font>")
  .getTextContent();
  
  if (display_type == "BodyTemplate7"){
    //use background image
    response.addRenderTemplateDirective({
      type: display_type,
      backButton: 'visible',
      backgroundImage: image,
      title:"",
      textContent: myTextContent,
      }); 
  }
  else{
    response.addRenderTemplateDirective({
      //use 340x340 image on the right with text on the left.
      type: display_type,
      backButton: 'visible',
      image: image,
      title:"",
      textContent: myTextContent,
      }); 
  }
  
  return response
}

function getAllResults(results_obj){
  if(results_obj==null)
    return null;

  var count = Object.keys(results_obj).length;

  var results_label = [];
  var results_uri = [];

  for(var f=0; f<count; f++){
    if('label' in results_obj[f])
      results_label.push(results_obj[f].label.value);
    else{
      results_label.push(results_obj[f].result.value);
    }
    results_uri.push(results_obj[f].result.value);
  }

  return {'label':results_label, 'uri':results_uri};

}

function trimResults(results, limit = limitResults){
  if(results==null)
    return null;

  var count = Object.keys(results).length;
  var trimmed_results = [];
  
  var num_results = count;
  if(count>limit)
    num_results = limit;
    
  for(var f=0; f<num_results; f++){
        if('label' in results[f] && results[f].label.type!="unbound")
            trimmed_results.push(results[f].label.value);
        else{
            var label = custom_functions.extractLabel(results[f].result.value)
            if(label.length>0)
              trimmed_results.push(label);
            else
              trimmed_results.push(results[f].result.value);
        }
    }

    return trimmed_results;
}


function getNumericFilterQuery(properties, symbol_label, value){
  //create query
  var symbol = LanguageManager["resolveAsMathSymbol"](lang, symbol_label);

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");
  for(var i=0; i<properties.length; i++){
    var sparql="SELECT DISTINCT ?result ?label WHERE {"+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?result "+properties[i]+ " ?value." + 
    "FILTER(?value "+symbol+" "+value+" )" + 
    "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

    //run query
    var results = custom_functions.runSelectQuery(sparql);
    var trimmed_results = trimResults(results);
    if(trimmed_results!=null && trimmed_results.legth>0){
      var count = Object.keys(results).length;

      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

      //store last request parameters
      var parameters = {
        'property': properties[i],
        'symbol':symbol,
        'value':value
      }; 

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);   

      return response;
    }
    
  }

  return getDateFilterQuery(properties, symbol_label, value);
}

function getDateFilterQuery(properties, symbol_label, value){
  //create query
  var symbol = LanguageManager["resolveAsMathSymbol"](lang, symbol_label);

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<properties.length; i++){
    var sparql="SELECT DISTINCT ?result ?label WHERE {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result "+properties[i]+ " ?value." + 
      "FILTER(year(?value) "+symbol+" "+value+" )" + 
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

    //run query
    var results = custom_functions.runSelectQuery(sparql)
    var trimmed_results = trimResults(results);

    if(trimmed_results!=null && trimmed_results.legth>0){
      var count = Object.keys(results).length;

      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

        //store last request parameters
      var parameters = {
        'property': properties[i],
        'symbol':symbol,
        'value':value
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);   

      return response;
    }


    //verbalize response
    var response = LanguageManager['results_response'](lang, 0, null);

      //store last request parameters
    var parameters = {
      'entity':entities,
      'property': properties,
      'symbol':symbol,
      'value':value
    };

    storeBackEndLastIntent(parameters, sparql, results, response, false);  
    return response;
  }

}

function getNumericFilterByClassQuery(entities, properties, symbol_label, value){
  //create query
  var symbol = LanguageManager["resolveAsMathSymbol"](lang, symbol_label);

  var sparql;

  var instances_predicates = custom_functions.getInstancesPredicates();
  var instances_predicates_as_string = instances_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<entities.length; i++){
    for(var j=0; j<properties.length; j++){
      sparql="SELECT DISTINCT ?result ?label ?property_instance WHERE {"+
      "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result ?property_instance "+entities[i]+". " + 
      "?result "+properties[j]+ " ?value. " + 
      "FILTER(?value "+symbol+" "+value+" ) " + 
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      var results = custom_functions.runSelectQuery(sparql)

      console.log("getNumericFilterByClassQuery")
      console.log(results)

      var trimmed_results = trimResults(results);
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);
        console.log("getNumericFilterByClassQuery")
        console.log(response)
          //store last request parameters
        var parameters = {
          'entity':entities[i],
          'property': properties[j],
          'symbol':symbol,
          'value':value
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }
  return getDateFilterByClassQuery(entities, properties,symbol,value);
}

function getDateFilterByClassQuery(entities, properties, symbol_label, value){
  //create query
  var symbol = LanguageManager["resolveAsMathSymbol"](lang, symbol_label);

  var sparql;
  var results = null;

  var instances_predicates = custom_functions.getInstancesPredicates();
  var instances_predicates_as_string = instances_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<entities.length; i++){
    for(var j=0; j<properties.length; j++){
      sparql="SELECT DISTINCT ?result ?label ?property_instance WHERE {"+
      "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result ?property_instance "+entities[i]+"." + 
      "?result "+properties[j]+ " ?value." + 
      "FILTER(year(?value) "+symbol+" "+value+" )" + 
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      results = custom_functions.runSelectQuery(sparql);

      console.log("getDateFilterByClassQuery")
      console.log(results)

      var trimmed_results = trimResults(results);
      
      if((trimmed_results!=null && trimmed_results.length>0)){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
        var parameters = {
          'entity':entities[i],
          'property': properties[j],
          'symbol':symbol,
          'value':value
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, null);

    //store last request parameters
  var parameters = {
    'entity':entities,
    'property': properties,
    'symbol':symbol,
    'value':value
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getPropertyObjectQuery(entities, properties){

  var sparql = '';
  var results = null;

  var label_predicates = custom_functions.getLabelPredicates();

  console.log(label_predicates)
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<entities.length; i++){
    for(var j=0; j<properties.length; j++){
      //create query
      sparql="SELECT ?result ?label WHERE {"+
        "VALUES ?property_label {"+label_predicates_as_string+"} "+
        entities[i]+" "+properties[j]+" ?result. " + 
        "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

        console.log(sparql)

      //run query
      results = custom_functions.runSelectQuery(sparql);
      console.log(results)
      var trimmed_results = trimResults(results);
      console.log(trimmed_results)
      
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

        //store last request parameters
        var parameters = {
          'entity':entities[i],
          'property': properties[j]
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
      
    }
  }

  var temp_results = getPropertySubjectQuery(entities, properties);
  if(temp_results.success)
    return temp_results;

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

  //store last request parameters
  var parameters = {
    'entity':entities,
    'property': properties
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getPropertyObjectByLabelQuery(entityLabel, properties){
  var sparql = '';
  var results = null;

  var label_predicates = custom_functions.getLabelPredicates();
  console.log(label_predicates)
  var label_predicates_as_string = label_predicates.join(" ");

  // perfect matching
  for(var j=0; j<properties.length; j++){
    //create query
    sparql="PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
      "SELECT DISTINCT ?result ?label WHERE {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?entity  "+properties[j]+" ?result. " + 
      "?entity ?property_label ?labelEntity.  " + 
      //"FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))" + 
      "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      console.log(sparql)

    //run query
    results = custom_functions.runSelectQuery(sparql);
    console.log(results)
    var trimmed_results = trimResults(results);
    console.log(trimmed_results)
    if(trimmed_results!=null && trimmed_results.length>0){
      var count = Object.keys(results).length;

      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

      //store last request parameters
      var parameters = {
        'entity':entityLabel,
        'property': properties[j]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }
    
  }

  //relaxed query
  for(var j=0; j<properties.length; j++){
    //create query
    sparql="PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
      "SELECT ?result ?label WHERE {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?entity  "+properties[j]+" ?result. " + 
      "?entity ?property_label ?labelEntity. " +
      //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))" +
      "FILTER(contains(lcase(?labelEntity),lcase('"+entityLabel+"'))) "+ 
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      console.log(sparql)

    //run query
    results = custom_functions.runSelectQuery(sparql);
    var trimmed_results = trimResults(results);
    
    if(trimmed_results!=null && trimmed_results.length>0){
      var count = Object.keys(results).length;

      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

      //store last request parameters
      var parameters = {
        'entity':entityLabel,
        'property': properties[j]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }
    
  }

  var temp_results = getPropertySubjectLabelQuery(entityLabel, properties);
  if(temp_results.success)
    return temp_results;


  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

  //store last request parameters
  var parameters = {
    'entity':entityLabel,
    'property': properties
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getTripleVerificationQuery(subjects, properties, objects){
  var sparql = '';
  var result = null;

  for(var i=0; i<subjects.length; i++){
    for(var k=0; k<properties.length; k++){
      for(var j=0; j<objects.length; j++){
        sparql="ASK {"+
          subjects[i] +" "+properties[k]+" "+objects[j]+"}";
              
        //run query
        result = custom_functions.runAskQuery(sparql);
              
        if(result){
          //verbalize response
          var response = LanguageManager['boolean_response'](lang, result);

          //store last request parameters
          var parameters = {
            'subject':subjects[i],
            'property': properties[k],
            'object':objects[j]
          };

          storeBackEndLastIntent(parameters, sparql, result, response, true);  
          return response;
        }     
      }
    }
  }
  
  //verbalize response
  var response = LanguageManager['boolean_response'](lang, false);

  //store last request parameters
  var parameters = {
    'subject':subjects,
    'property': properties,
    'object':objects
  };

  storeBackEndLastIntent(parameters, sparql, result, response, false);  
  return response; 
}

function getTripleVerificationByObjectLabelQuery(subjects, properties, objectLabel){
  var sparql = '';
  var result = null;

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");


  for(var i=0; i<subjects.length; i++){
    for(var k=0; k<properties.length; k++){
        sparql="ASK {"+
          "VALUES ?property_label {"+label_predicates_as_string+"} "+
          subjects[i] +" "+properties[k]+" ?object. " +
          "?object ?property_label ?objectLabel."+
          //"FILTER(regex(?objectLabel,'^" + objectLabel + "$', 'i'))" + 
          "FILTER(lcase(?objectLabel)=lcase('"+objectLabel+"')) "+
          "}";
              
        //run query
        result = custom_functions.runAskQuery(sparql);
              
        if(result){
          //verbalize response
          var response = LanguageManager['boolean_response'](lang, result);

          //store last request parameters
          var parameters = {
            'subject':subjects[i],
            'property': properties[k],
            'object':objectLabel
          };

          storeBackEndLastIntent(parameters, sparql, result, response, true);  
          return response;
        } 
        else{
          for(var i=0; i<subjects.length; i++){
            for(var k=0; k<properties.length; k++){
              sparql="ASK {"+
              "VALUES ?property_label {"+label_predicates_as_string+"} "+
                subjects[i] +" "+properties[k]+" ?object. " +
                "?object ?property_label ?objectLabel. "+
                //"FILTER(regex(?objectLabel,'" + objectLabel + "', 'i'))" + 
                "FILTER(contains(lcase(?objectLabel),lcase('"+objectLabel+"'))) "+
                "}";
                    
              //run query
              result = custom_functions.runAskQuery(sparql);
                    
              if(result){
                //verbalize response
                var response = LanguageManager['boolean_response'](lang, result);

                //store last request parameters
                var parameters = {
                  'subject':subjects[i],
                  'property': properties[k],
                  'object':objectLabel
                };

                storeBackEndLastIntent(parameters, sparql, result, response, true);  
                return response;
              } 
            }    
          }
        }
      }
    }
  
  //verbalize response
  var response = LanguageManager['boolean_response'](lang, false);

  //store last request parameters
  var parameters = {
    'subject':subjects,
    'property': properties,
    'object':objectLabel
  };

  storeBackEndLastIntent(parameters, sparql, result, response, false);  
  return response; 
}

function getTripleVerificationBySubjectLabelQuery(subjectLabel, properties, objects){
  var sparql = '';
  var result = null;

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var k=0; k<properties.length; k++){
      for(var i=0; i<objects.length; i++){
        sparql="ASK {"+
        "VALUES ?property_label {"+label_predicates_as_string+"} "+
          "?subject "+properties[k]+" " + objects[i] + ". "+
          "?subject ?property_label ?subjectLabel."+
          //" FILTER(regex(?subjectLabel,'^" + subjectLabel + "$', 'i'))" + 
          "FILTER(lcase(?subjectLabel)=lcase('"+subjectLabel+"')) "+
          "}";
              
        //run query
        result = custom_functions.runAskQuery(sparql);
              
        if(result){
          //verbalize response
          var response = LanguageManager['boolean_response'](lang, result);

          //store last request parameters
          var parameters = {
            'subject':subjectLabel,
            'property': properties[k],
            'object':objects[i]
          };

          storeBackEndLastIntent(parameters, sparql, result, response, true);  
          return response;
        } 
      }
    }

    for(var i=0; i<subjects.length; i++){
      for(var k=0; k<properties.length; k++){
        sparql="ASK {"+
        "VALUES ?property_label {"+label_predicates_as_string+"} "+
          "?subject "+properties[k]+" " + objects[i] + ". "+
          "?subject ?property_label ?subjectLabel. "+
          //" FILTER(regex(?subjectLabel,'" + subjectLabel + "', 'i'))" + 
          "FILTER(contains(lcase(?subjectLabel),lcase('"+subjectLabel+"'))) "+
          "}";
              
        //run query
        result = custom_functions.runAskQuery(sparql);
              
        if(result){
          //verbalize response
          var response = LanguageManager['boolean_response'](lang, result);

          //store last request parameters
          var parameters = {
            'subject':subjectLabel,
            'property': properties[k],
            'object':objects[i]
          };

          storeBackEndLastIntent(parameters, sparql, result, response, true);  
          return response;
        } 
      }    
    }
  
  //verbalize response
  var response = LanguageManager['boolean_response'](lang, false);

  //store last request parameters
  var parameters = {
    'subject':subjectLabel,
    'property': properties,
    'object':objects
  };

  storeBackEndLastIntent(parameters, sparql, result, response, false);  
  return response; 
}

function getTripleVerificationBySubjectAndObjectLabelQuery(subjectLabel, properties, objectLabel){
  var sparql = '';
  var result = null;

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var k=0; k<properties.length; k++){
    sparql="ASK {"+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?subject "+properties[k]+" ?object. "+
      "?subject ?property_label ?subjectLabel. "+
      //" FILTER(regex(?subjectLabel,'^" + subjectLabel + "$', 'i'))" + 
      "FILTER(lcase(?subjectLabel)=lcase('"+subjectLabel+"')) "+
      "?object ?property_label ?objectLabel. "+
      //" FILTER(regex(?objectLabel,'^" + objectLabel + "$', 'i'))" + 
      "FILTER(lcase(?objectLabel)=lcase('"+objectLabel+"')) "+
      "}";
          
    //run query
    result = custom_functions.runAskQuery(sparql);
          
    if(result){
      //verbalize response
      var response = LanguageManager['boolean_response'](lang, result);

      //store last request parameters
      var parameters = {
        'subject':subjectLabel,
        'property': properties[k],
        'object':objectLabel
      };

      storeBackEndLastIntent(parameters, sparql, result, response, true);  
      return response;
    }     
   }
    for(var k=0; k<properties.length; k++){
      sparql="ASK {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
        "?subject "+properties[k]+" ?object. "+
        "?subject ?property_label ?subjectLabel. "+
        //" FILTER(regex(?subjectLabel,'" + subjectLabel + "', 'i'))" + 
        "FILTER(contains(lcase(?subjectLabel),lcase('"+subjectLabel+"'))) "+
        "?object ?property_label ?objectLabel. "+
        //" FILTER(regex(?objectLabel,'" + objectLabel + "', 'i'))" + 
        "FILTER(contains(lcase(?objectLabel),lcase('"+objectLabel+"'))) "+
        "}";
            
      //run query
      result = custom_functions.runAskQuery(sparql);
            
      if(result){
        //verbalize response
        var response = LanguageManager['boolean_response'](lang, result);

        //store last request parameters
        var parameters = {
          'subject':subjectLabel,
          'property': properties[k],
          'object':objectLabel
        };

        storeBackEndLastIntent(parameters, sparql, result, response, true);  
        return response;
      } 
    }    
    

  
  //verbalize response
  var response = LanguageManager['boolean_response'](lang, false);

  //store last request parameters
  var parameters = {
    'subject':subjectLabel,
    'property': properties,
    'object':objectLabel
  };

  storeBackEndLastIntent(parameters, sparql, result, response, false);  
  return response; 
}

function getPropertySubjectLabelQuery(entityLabel, properties){
  var sparql = '';
  var results = null;

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");
  for(var j=0; j<properties.length; j++){
    //create query
    sparql="SELECT ?result ?label WHERE {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result "+properties[j]+" ?entity. "+
      "?entity ?property_label ?labelEntity.  "+
      //"FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))" + 
      "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

    //run query
    results = custom_functions.runSelectQuery(sparql)
    var trimmed_results = trimResults(results);
    
    if(trimmed_results!=null && trimmed_results.length>0){
      var count = Object.keys(results).length;

      //verbalize response
      response = LanguageManager['results_response'](lang, count, trimmed_results);

        //store last request parameters
      var parameters = {
        'entity':entityLabel,
        'property': properties[j]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }
    
    
  }

  for(var j=0; j<properties.length; j++){
    //create query
    sparql="SELECT ?result ?label WHERE {"+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result "+properties[j]+" ?entity. "+
      "?entity ?property_label ?labelEntity. "+
      //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))" + 
      "FILTER(contains(lcase(?labelEntity),lcase('"+entityLabel+"'))) "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

    //run query
    results = custom_functions.runSelectQuery(sparql)
    var trimmed_results = trimResults(results);
    
    if(trimmed_results!=null && trimmed_results.length>0){
      var count = Object.keys(results).length;

      //verbalize response
      response = LanguageManager['results_response'](lang, count, trimmed_results);

        //store last request parameters
      var parameters = {
        'entity':entityLabel,
        'property': properties[j]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }
    
    
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'entity':entityLabel,
    'property': properties
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getPropertySubjectQuery(entities, properties){
  var sparql = '';
  var results = null;

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");
  for(var i=0; i<entities.length; i++){
    for(var j=0; j<properties.length; j++){
      //create query
      sparql="SELECT ?result ?label WHERE {"+
        "VALUES ?property_label {"+label_predicates_as_string+"} "+
        "?result "+properties[j]+" "+entities[i]+". "+
        "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      results = custom_functions.runSelectQuery(sparql)
      var trimmed_results = trimResults(results);
      
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
        var parameters = {
          'entity':entities[i],
          'property': properties[j]
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'entity':entities,
    'property': properties
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getPropertySubjectByClassQuery(classes, properties, entities){
  var sparql = '';
  var results = null;

  var instances_predicates = custom_functions.getInstancesPredicates();
  var instances_predicates_as_string = instances_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<classes.length; i++){
    for(var j=0; j<properties.length; j++){
      sparql="SELECT DISTINCT ?result ?label ?property_instance WHERE {"+
      "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result ?property_instance "+classes[i]+"; " + 
               properties[j]+" "+entities[0]+". "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      results = custom_functions.runSelectQuery(sparql);
      var trimmed_results = trimResults(results);
      
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
        var parameters = {
          'class':classes[i],
          'property': properties[j],
          'entity':entities[0]
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'class':classes,
    'property': properties,
    'entity':entities[0]
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getPropertySubjectByClassAndEntityLabelQuery(classes, properties, entityLabel){
  var sparql = '';
  var results = null;

  var instances_predicates = custom_functions.getInstancesPredicates();
  var instances_predicates_as_string = instances_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<classes.length; i++){
    for(var j=0; j<properties.length; j++){
      sparql="SELECT DISTINCT ?result ?label ?property_instance WHERE {"+
      "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result ?property_instance "+classes[i]+"; " + 
               properties[j]+" ?entity. "+
      "?entity ?property_label ?labelEntity. "+
      //" FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))" + 
      "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      results = custom_functions.runSelectQuery(sparql);
      var trimmed_results = trimResults(results);
      
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
        var parameters = {
          'class':classes[i],
          'property': properties[j],
          'entity':entityLabel
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }

  for(var i=0; i<classes.length; i++){
    for(var j=0; j<properties.length; j++){
      sparql="SELECT DISTINCT ?result ?label WHERE {"+
      "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      "?result ?property_instance "+classes[i]+"; " + 
               properties[j]+" ?entity. "+
      "?entity ?property_label ?labelEntity. "+
      //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))" + 
      "FILTER(contains(lcase(?labelEntity),lcase('"+entityLabel+"'))) "+
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}";

      //run query
      results = custom_functions.runSelectQuery(sparql);
      var trimmed_results = trimResults(results);
      
      if(trimmed_results!=null && trimmed_results.length>0){
        var count = Object.keys(results).length;

        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
        var parameters = {
          'class':classes[i],
          'property': properties[j],
          'entity':entityLabel
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }
    
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'class':classes,
    'property': properties,
    'entity':entityLabel
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getSuperlativeQuery(entities, properties, superlative){
  var order = LanguageManager["resolveAsOrder"](lang, superlative);
  var results = null; 
  var sparql = '';

  var instances_predicates = custom_functions.getInstancesPredicates();
  var instances_predicates_as_string = instances_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  for(var i=0; i<entities.length; i++){
    for(var j=0; j<properties.length; j++){
      //create query
      sparql="SELECT ?result ?label ?property_instance WHERE{"+
              "VALUES ?class {"+entities[i]+"} "+
              "VALUES ?property {"+properties[j]+"} "+
              "VALUES ?property_instance {"+instances_predicates_as_string+"} "+
              "VALUES ?property_label {"+label_predicates_as_string+"} "+
              "?result ?property_instance ?class. "+
              "?result ?property ?value. "+
              "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}" + 
              "ORDER BY "+order+"(?value)"+
              "LIMIT 1";

      //run query
      results = custom_functions.runSelectQuery(sparql);

      var count = Object.keys(results).length;
      if(count>0){
        //verbalize response
        var response = LanguageManager['results_response'](lang, count, getAllResults(results).label);

          //store last request parameters
        var parameters = {
          'entity':entities[i],
          'property': properties[j],
          'superlative':order
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
    }  
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'entity':entities,
    'property': properties,
    'superlative':order
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getImgQuery(entities){
  var sparql = '';
  var results = null;

  var img_predicates = custom_functions.getImgPredicates();
  var img_predicates_as_string = img_predicates.join(" ");

  for(var i=0; i<entities.length; i++){
    //create query
    sparql="SELECT ?result ?label ?property_img WHERE { " + 
      "VALUES ?property_img {"+img_predicates_as_string+"} "+
      entities[i]+" ?property_img ?result.}";        

    var results = custom_functions.runSelectQuery(sparql);
    var count = Object.keys(results).length;

    if(count>0){
      //var single_image = [results[0].result.value];
      //var response = LanguageManager['img_response'](lang, single_image);

      var property_img = results[0].property_img.value;
      //store last request parameters
      var parameters = {
        'entity':entities[i],
        'property':property_img
      };

      storeBackEndLastIntent(parameters, sparql, results[0].result.value, results[0].result.value, true);  
      return results[0].result.value;
    }
  }

  var response = LanguageManager['img_response'](lang, results);

  var parameters = {
    'entity':entities
  };
  
  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  //LanguageManager.ErrorHandler(lang);
  results[0].result.value;
  return;
}

function getImgByLabelQuery(entityLabel){
  var sparql = '';
  var results = null;

  var img_predicates = custom_functions.getImgPredicates();
  var img_predicates_as_string = img_predicates.join(" ");

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  //create query
  sparql="SELECT ?result ?label ?property_img WHERE { " + 
    "VALUES ?property_img {"+img_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_img ?result." +
    "?entity ?property_label ?labelEntity. "+
    //" FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))"+
    "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
    "}"  ;


  var results = custom_functions.runSelectQuery(sparql);
  var count = Object.keys(results).length;

  if(count>0){
    //var single_image = [results[0].result.value];
    //var response = LanguageManager['img_response'](lang, single_image);

    var property_img = results[0].property_img.value;
    //store last request parameters
    var parameters = {
      'entity':entityLabel,
      'property':property_img
    };

    storeBackEndLastIntent(parameters, sparql, results[0].result.value, results[0].result.value, true);  
    return results[0].result.value;
  }

  sparql="SELECT ?result ?label ?property_img WHERE { " + 
    "VALUES ?property_img {"+img_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_img ?result." +
    "?entity ?property_label ?labelEntity. "+
    //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))"+
    "FILTER(contains(lcase(?labelEntity),lcase('"+entityLabel+"'))) "+
    " }"  ;


  var results = custom_functions.runSelectQuery(sparql);
  var count = Object.keys(results).length;

  if(count>0){
    //var single_image = [results[0].result.value];
    //var response = LanguageManager['img_response'](lang, single_image);

    var property_img = results[0].property_img.value;
    //store last request parameters
    var parameters = {
      'entity':entityLabel,
      'property':property_img
    };

    storeBackEndLastIntent(parameters, sparql, results[0].result.value, results[0].result.value, true);  
    return results[0].result.value;
  }
  

  var response = LanguageManager['img_response'](lang, results);

  var parameters = {
    'entity':entities
  };
  
  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  //LanguageManager.ErrorHandler(lang);
  results[0].result.value;
  return;
}

function getDescriptionQuery(entities){

  var sparql = '';
  var descriptions = [];

  var description_predicates = custom_functions.getDescriptionPredicates();
  var description_predicates_as_string = description_predicates.join(" ");       

  for(var i=0; i<entities.length; i++){
      sparql="SELECT ?description WHERE {"+
        "VALUES ?property_description {"+description_predicates_as_string+"} "+
        entities[i]+" ?property_description ?description. "+
        "OPTIONAL{FILTER(lang(?description)='"+lang+"')}}";

      var results = custom_functions.runSelectQuery(sparql);
      if(results.length>0)
        descriptions.push(results[0].description.value);
     
  }
  console.log("getDescriptionQuery")
  console.log(descriptions)

  //verbalize response
  var response = LanguageManager['getDescription_response'](lang, descriptions);

  //store last request parameters
  var parameters = {
    'entity':entities
  };

  var success = false;
  if(descriptions.length>0)
    success = true;

  storeBackEndLastIntent(parameters, sparql, descriptions, response, success);  
  return response; 
}

function getDescriptionByLabelQuery(entityLabel){

  var sparql = '';
  var descriptions = [];

  var description_predicates = custom_functions.getDescriptionPredicates();
  var description_predicates_as_string = description_predicates.join(" ");    

  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  sparql="SELECT ?description WHERE {"+
    "VALUES ?property_description {"+description_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_description ?description. "+
    "?entity ?property_label ?labelEntity. "+
    //" FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))" + 
    "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
    "OPTIONAL{FILTER(lang(?description)='"+lang+"')}"+
    " }";

  var results = custom_functions.runSelectQuery(sparql);
  if(results.length>0)
    descriptions.push(results[0].description.value); 
  else{
    sparql="PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
    "SELECT ?description WHERE {"+
    "VALUES ?property_description {"+description_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_description ?description. "+
    "?entity ?property_label ?labelEntity. "+
    //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))" + 
    "FILTER(contains(lcase(?labelEntity),lcase('"+entityLabel+"'))) "+
    "OPTIONAL{FILTER(lang(?description)='"+lang+"')}}";

    var results = custom_functions.runSelectQuery(sparql);
    if(results.length>0)
      descriptions.push(results[0].description.value); 
  }

  console.log("getDescriptionByLabelQuery")
  console.log(descriptions)

  //verbalize response
  var response = LanguageManager['getDescription_response'](lang, descriptions);

  //store last request parameters
  var parameters = {
    'entity':entityLabel
  };

  var success = false;
  if(descriptions.length>0)
    success = true;

  storeBackEndLastIntent(parameters, sparql, descriptions, response, success);  
  return response; 
}

function getClassInstancesQuery(entities){
  var sparql = '';
    var results = null;

    var instances_predicates = custom_functions.getInstancesPredicates();
    //var instances_predicates_as_string = instances_predicates.join(" ");

    var label_predicates = custom_functions.getLabelPredicates();
    var label_predicates_as_string = label_predicates.join(" ");
    for(var i=0; i<entities.length; i++){
      for(var j=0; j<instances_predicates.length; j++){
        //create query
        sparql="SELECT DISTINCT ?result ?label WHERE {"+
        "VALUES ?property_label {"+label_predicates_as_string+"} "+
        "?result " + instances_predicates[j] +" "+entities[i]+". "+
        "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}} "; 
        //+ "LIMIT 1000";

        //run query
        results = custom_functions.runSelectQuery(sparql);
        var trimmed_results = trimResults(results);
        var count = Object.keys(results).length;

        if(trimmed_results!=null && trimmed_results.length>0){
          //verbalize response
          var response = LanguageManager['results_response'](lang, count, trimmed_results);

          //store last request parameters
            var parameters = {
            'entity':entities[i],
            'property':instances_predicates[j]
          };

          storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
          return response; 
        }
      }
    }

    //verbalize response
    var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
    var parameters = {
      'entity':entities
    };

    storeBackEndLastIntent(parameters, sparql, results, response, false);  
    return response; 
}

function getLocationQuery(entities){
  var sparql;
  var results = null;

  var location_predicates = custom_functions.getLocationPredicates();
  var location_predicates_as_string = location_predicates.join(" ");
  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");
  for(var i=0; i<entities.length; i++){
    //create query
    sparql="SELECT ?result ?label ?property_location WHERE { " + 
      "VALUES ?property_location {"+location_predicates_as_string+"} "+
      "VALUES ?property_label {"+label_predicates_as_string+"} "+
      entities[i]+" ?property_location ?result." + 
      "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}" + 
      "ORDER BY DESC(?result)"; 

      //run query
      results = custom_functions.runSelectQuery(sparql);
      var trimmed_results = trimResults(results, 1);
      var count = Object.keys(results).length;

      if(trimmed_results!=null && trimmed_results.length>0){
        //verbalize response
        var response = LanguageManager['results_response'](lang, count, trimmed_results);

        //store last request parameters
        var property_location = results[0].property_location.value;
        var parameters = {
          'property':property_location,
          'entity':entities[i]
        };

        storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
        return response; 
      }
  }

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'property':location_predicates,
    'entity':entities
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function getLocationByLabelQuery(entityLabel){
  var sparql;
  var results = null;

  var location_predicates = custom_functions.getLocationPredicates();
  var location_predicates_as_string = location_predicates.join(" ");
  var label_predicates = custom_functions.getLabelPredicates();
  var label_predicates_as_string = label_predicates.join(" ");

  //create query
  sparql="PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
    "SELECT ?result ?label ?property_location WHERE { " + 
    "VALUES ?property_location {"+location_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_location ?result." + 
    "?entity ?property_label ?labelEntity.  " + 
    //"FILTER(regex(?labelEntity,'^" + entityLabel + "$', 'i'))" + 
    "FILTER(lcase(?labelEntity)=lcase('"+entityLabel+"')) "+
    "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}" + 
    "ORDER BY DESC(?result)"; 

    //run query
    results = custom_functions.runSelectQuery(sparql);
    var trimmed_results = trimResults(results, 1);
    var count = Object.keys(results).length;

    if(trimmed_results!=null && trimmed_results.length>0){
      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

      //store last request parameters
      var property_location = results[0].property_location.value;
      var parameters = {
        'property':property_location,
        'entity':entities[i]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }

  sparql="PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
    "SELECT ?result ?label ?property_location WHERE { " + 
    "VALUES ?property_location {"+location_predicates_as_string+"} "+
    "VALUES ?property_label {"+label_predicates_as_string+"} "+
    "?entity ?property_location ?result." + 
    "?entity ?property_label ?labelEntity. " +
    //" FILTER(regex(?labelEntity,'" + entityLabel + "', 'i'))" + 
    "filter(contains(lcase(?labelEntity),"+entityLabel+")) "+
    "OPTIONAL{?result ?property_label ?label. FILTER(lang(?label)='"+lang+"')}}" + 
    "ORDER BY DESC(?result)"; 

    //run query
    results = custom_functions.runSelectQuery(sparql);
    var trimmed_results = trimResults(results, 1);
    var count = Object.keys(results).length;

    if(trimmed_results!=null && trimmed_results.length>0){
      //verbalize response
      var response = LanguageManager['results_response'](lang, count, trimmed_results);

      //store last request parameters
      var property_location = results[0].property_location.value;
      var parameters = {
        'property':property_location,
        'entity':entities[i]
      };

      storeBackEndLastIntent(parameters, sparql, getAllResults(results), response, true);  
      return response; 
    }
  

  //verbalize response
  var response = LanguageManager['results_response'](lang, 0, results);

    //store last request parameters
  var parameters = {
    'property':location_predicates,
    'entity':entities
  };

  storeBackEndLastIntent(parameters, sparql, results, response, false);  
  return response; 
}

function capitalize(myString) {
    return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }) ;
}

function randomElement(myArray) { 
    return(myArray[Math.floor(Math.random() * myArray.length)]); 
} 
 
function stripSpeak(str) { 
    return(str.replace('<speak>', '').replace('</speak>', '')); 
} 
 
function getSlotValues(filledSlots) { 
    const slotValues = {}; 
 
    Object.keys(filledSlots).forEach((item) => { 
        const name  = filledSlots[item].name; 
 
        if (filledSlots[item] && 
            filledSlots[item].resolutions && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0] && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
                case 'ER_SUCCESS_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name, 
                        ERstatus: 'ER_SUCCESS_MATCH' 
                    }; 
                    break; 
                case 'ER_SUCCESS_NO_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: '', 
                        ERstatus: 'ER_SUCCESS_NO_MATCH' 
                    }; 
                    break; 
                default: 
                    break; 
            } 
        } else { 
            slotValues[name] = { 
                heardAs: filledSlots[item].value, 
                resolved: '', 
                ERstatus: '' 
            }; 
        } 
    }, this); 
 
    return slotValues; 
} 
 
function getExampleSlotValues(intentName, slotName) { 
 
    let examples = []; 
    let slotType = ''; 
    let slotValuesFull = []; 
 
    let intents = model.interactionModel.languageModel.intents; 
    for (let i = 0; i < intents.length; i++) { 
        if (intents[i].name == intentName) { 
            let slots = intents[i].slots; 
            for (let j = 0; j < slots.length; j++) { 
                if (slots[j].name === slotName) { 
                    slotType = slots[j].type; 
 
                } 
            } 
        } 
         
    } 
    let types = model.interactionModel.languageModel.types; 
    for (let i = 0; i < types.length; i++) { 
        if (types[i].name === slotType) { 
            slotValuesFull = types[i].values; 
        } 
    } 
 
 
    examples.push(slotValuesFull[0].name.value); 
    examples.push(slotValuesFull[1].name.value); 
    if (slotValuesFull.length > 2) { 
        examples.push(slotValuesFull[2].name.value); 
    } 
 
 
    return examples; 
} 
 
function sayArray(myData, penultimateWord = 'and') { 
    let result = ''; 
 
    myData.forEach(function(element, index, arr) { 
 
        if (index === 0) { 
            result = element; 
        } else if (index === myData.length - 1) { 
            result += ` ${penultimateWord} ${element}`; 
        } else { 
            result += `, ${element}`; 
        } 
    }); 
    return result; 
} 

// returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.)
function supportsDisplay(handlerInput) {                                      
    //  Enable your skill for display as shown here: https://alexa.design/enabledisplay 
    const hasDisplay = 
        handlerInput.requestEnvelope.context && 
        handlerInput.requestEnvelope.context.System && 
        handlerInput.requestEnvelope.context.System.device && 
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces && 
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display; 
 
    return hasDisplay; 
} 
 
const welcomeCardImg = { 
    smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png", 
    largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png" 
 
 
}; 
 
const DisplayImg1 = { 
    title: 'Jet Plane', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/plane340_340.png' 
}; 
const DisplayImg2 = { 
    title: 'Starry Sky', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/background1024_600.png' 
 
}; 
 
function getCustomIntents() { 
    const modelIntents = model.interactionModel.languageModel.intents; 
 
    let customIntents = []; 
 
    for (let i = 0; i < modelIntents.length; i++) { 
 
        if(modelIntents[i].name.substring(0,7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest" ) { 
            customIntents.push(modelIntents[i]); 
        } 
    } 
    return customIntents; 
} 
 
function getSampleUtterance(intent) { 
    return randomElement(intent.samples); 
} 
 
function getPreviousIntent(attrs) { 
    if (attrs.history && attrs.history.length > 1) { 
        return attrs.history[attrs.history.length - 2].IntentRequest; 
 
    } else { 
        return false; 
    } 
} 
 
function getPreviousSpeechOutput(attrs) { 
    if (attrs.lastSpeechOutput && attrs.history.length > 1) { 
        return attrs.lastSpeechOutput; 
 
    } else { 
        return false; 
    } 
} 
 
function timeDelta(t1, t2) { 
    const dt1 = new Date(t1); 
    const dt2 = new Date(t2); 
    const timeSpanMS = dt2.getTime() - dt1.getTime(); 
    const span = { 
        "timeSpanMIN": Math.floor(timeSpanMS / (1000 * 60 )), 
        "timeSpanHR": Math.floor(timeSpanMS / (1000 * 60 * 60)), 
        "timeSpanDAY": Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)), 
        "timeSpanDesc" : "" 
    }; 
 
    if (span.timeSpanHR < 1) { 
        span.timeSpanDesc = span.timeSpanMIN + " minutes"; 
    } else if (span.timeSpanDAY < 1) { 
        span.timeSpanDesc = span.timeSpanHR + " hours"; 
    } else { 
        span.timeSpanDesc = span.timeSpanDAY + " days"; 
    } 

    return span; 
} 
 
 
const InitMemoryAttributesInterceptor = { 
    process(handlerInput) { 
        let sessionAttributes = {}; 
        if(handlerInput.requestEnvelope.session['new']) { 
 
            sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
            let memoryAttributes = getMemoryAttributes(); 
 
            if(Object.keys(sessionAttributes).length === 0) { 
 
                Object.keys(memoryAttributes).forEach(function(key) {  // initialize all attributes from global list 
 
                    sessionAttributes[key] = memoryAttributes[key]; 
 
                }); 
 
            } 
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
 
        } 
    } 
}; 
 
const RequestHistoryInterceptor = { 
    process(handlerInput) { 
 
        const thisRequest = handlerInput.requestEnvelope.request; 
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
        let history = sessionAttributes['history'] || []; 
 
        let IntentRequest = {}; 
        if (thisRequest.type === 'IntentRequest' ) { 
 
            let slots = []; 
 
            IntentRequest = { 
                'IntentRequest' : thisRequest.intent.name 
            }; 
 
            if (thisRequest.intent.slots) { 
 
                for (let slot in thisRequest.intent.slots) { 
                    let slotObj = {}; 
                    slotObj[slot] = thisRequest.intent.slots[slot].value; 
                    slots.push(slotObj); 
                } 
 
                IntentRequest = { 
                    'IntentRequest' : thisRequest.intent.name, 
                    'slots' : slots 
                }; 
 
            } 
 
        } else { 
            IntentRequest = {'IntentRequest' : thisRequest.type}; 
        } 
        if(history.length > maxHistorySize - 1) { 
            history.shift(); 
        } 
        history.push(IntentRequest); 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
 
}; 
 
const RequestPersistenceInterceptor = { 
    process(handlerInput) { 
 
        if(handlerInput.requestEnvelope.session['new']) { 
 
            return new Promise((resolve, reject) => { 
 
                handlerInput.attributesManager.getPersistentAttributes() 
 
                    .then((sessionAttributes) => { 
                        sessionAttributes = sessionAttributes || {}; 
 
 
                        sessionAttributes['launchCount'] += 1; 
 
                        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
                        handlerInput.attributesManager.savePersistentAttributes() 
                            .then(() => { 
                                resolve(); 
                            }) 
                            .catch((err) => { 
                                reject(err); 
                            }); 
                    }); 
 
            }); 
 
        } // end session['new'] 
    } 
}; 
 
 
const ResponseRecordSpeechOutputInterceptor = { 
    process(handlerInput, responseOutput) { 
 
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
        let lastSpeechOutput = { 
            "outputSpeech":responseOutput.outputSpeech.ssml, 
            "reprompt":responseOutput.reprompt.outputSpeech.ssml 
        }; 
 
        sessionAttributes['lastSpeechOutput'] = lastSpeechOutput; 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
}; 
 
const ResponsePersistenceInterceptor = { 
    process(handlerInput, responseOutput) { 
 
        const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession); 
 
        if(ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out 
 
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
            sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime(); 
 
            handlerInput.attributesManager.setPersistentAttributes(sessionAttributes); 
 
            return new Promise((resolve, reject) => { 
                handlerInput.attributesManager.savePersistentAttributes() 
                    .then(() => { 
                        resolve(); 
                    }) 
                    .catch((err) => { 
                        reject(err); 
                    }); 
 
            }); 
 
        } 
 
    } 
}; 
 
 

//Utilities slot resolution
//TODO verbalization
function resolveSlot(intentName, parameterName, slotValues){
  var response = {
    parameterName : '',
    'slotStatus' : ''
  }


  if (slotValues[parameterName].heardAs) {
    response.slotStatus += slotValues[parameterName].heardAs;
    response[parameterName]=slotValues[parameterName].heardAs ;
  } else {
    response.slotStatus += parameterName + ' empty ';
    response[parameterName]=null
  }
  if (slotValues[parameterName].ERstatus === 'ER_SUCCESS_MATCH') {
     
      if(slotValues[parameterName].resolved !== slotValues[parameterName].heardAs) {
          response.slotStatus += slotValues[parameterName].resolved; 
          response[parameterName]=slotValues[parameterName].resolved; 
      } 
  }
  /*
  if (slotValues[parameterName].ERstatus === 'ER_SUCCESS_NO_MATCH') {
      response.slotStatus += 'which did not match any slot value. ';
      response[parameterName]=null
  }

  if( (slotValues[parameterName].ERstatus === 'ER_SUCCESS_NO_MATCH') ||  (!slotValues[parameterName].heardAs) ) {
    var options = '';
    switch (parameterName){
      case 'property':
        options = sayArray(getExampleSlotValues(intentName,'property'), 'or');
        break;
      case 'superlative':
        options = sayArray(getExampleSlotValues(intentName,'superlative'), 'or');
        break;
      default:
         options = sayArray(getExampleSlotValues(intentName,'entity'), 'or');
    }

    response.slotStatus += 'A few valid values are, ' + options;
    response[parameterName]=null
  }
  */

  return response;
}

// Utilities storage last request
function storeLastIntent(intentName, parameters){
  last_request.intent = intentName;
  last_request.slots.actual_values=parameters;
}

function storeBackEndLastIntent(parameters, sparql, results, response, success){
  last_request.slots.resolved_values=parameters;
  last_request.sparql = sparql;
  last_request.results = results;
  last_request.response = response;
  last_request.success = success;
}


// Utilities: language management
function removeSpecialCharacters(originalString){
  var modifiedString=originalString;

  var specialCharacters = ["-", "_", "/", '"'];

  for(var specialCharacter of specialCharacters){
    if(modifiedString.indexOf(specialCharacter)>=0){
      modifiedString = modifiedString.replace(specialCharacter, " ");
    }
  }

  if(modifiedString.indexOf("&")>=0)
    modifiedString = modifiedString.replace("&", " and ");

  return modifiedString;
}

var LanguageManager = {};

LanguageManager.getFurtherDetails_subject = function(current_lang, subject){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'Ecco ulteriori dettagli relativi a ' + subject+". ";
      break;
    case "en":
    default:
      response = 'Here details about ' + subject+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getQualifierDetails_triple = function(current_lang, subject, property, object){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = "Sto cercando qualificatori relativi all'affermazione: " + subject + ' ha '+property+' uguale a '+ object + '.';
      break;
    case "en":
    default:
      response = 'I am looking for qualifiers related to the statement: ' + subject + ' has '+ object + ' as '+property+'. ';
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getReferenceDetails_triple = function(current_lang, subject, property, object){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = "Sto cercando referenze relativi all'affermazione: " + subject + ' ha '+property+' uguale a '+ object + '.';
      break;
    case "en":
    default:
      response = 'I am looking for references related to the statement: ' + subject + ' has '+ object + ' as '+property+'. ';
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_endDate = function(current_lang, date){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'Era valido fino al ' + date +". " ;
      break;
    case "en":
    default:
      response = 'It was valid until ' + date +". " ;
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_startDate = function(current_lang, date){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'è valido a partire dal ' + date+". ";
      break;
    case "en":
    default:
      response = 'It is valid starting from ' + date+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_date = function(current_lang, date){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'Era valido in data ' + date+". ";
      break;
    case "en":
    default:
      response = 'It was valid in ' + date+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_pubDate = function(current_lang, date){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'La data della referenza è ' + date+". ";
      break;
    case "en":
    default:
      response = 'The reference date is ' + date+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_refSource = function(current_lang, source){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = 'La sorgente della referenza è ' + source+". ";
      break;
    case "en":
    default:
      response = 'The reference source is ' + source+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getFurtherDetails_refCurator = function(current_lang, curator){
  var response = ''; 

  switch(current_lang){
    case "it":
      response = curator + " si è occupato della referenza. ";
      break;
    case "en":
    default:
      response = 'The curator of the reference is ' + curator+". ";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}


function en_resolveAsMathSymbol(symbol_label){
  var symbol = null;

  if(symbol_label=='more than' || symbol_label=="more" || symbol_label==">"){
      symbol='>';
    }
    else if(symbol_label=='less than' || symbol_label=="less" || symbol_label=="<"){
      symbol='<';
    }
    else if(symbol_label=='equals to' || symbol_label=="equals" || symbol_label=="="){
      symbol='=';
    }

    return symbol;
}

function en_resolveAsMathSymbolLabel(symbol){
  var symbol_label = "";

  if(symbol==">"){
      symbol_label= "greater than";
    }
    else if(symbol=="<"){
      symbol_label='lower than';
    }
    else if(symbol=="="){
      symbol_label='equals to';
    }

    return symbol_label;
}

function en_resolveAsOrder(superlative){
  var order = null;
  
  if(superlative=='least' || superlative=='minimum' || superlative == 'lowest'){
      order='ASC'
  }
  else if(superlative=='most' || superlative=='maximum' || superlative == 'highest'){
      order='DESC'
  }
  
  return order;
}

function it_resolveAsMathSymbol(symbol_label){
  var symbol = null;

  if(symbol_label=='maggiore di' || symbol_label==">"){
      symbol='>';
    }
    else if(symbol_label=='minore di' || symbol_label=="<"){
      symbol='<';
    }
    else if(symbol_label=='uguale a' || symbol_label=="="){
      symbol='=';
    }

    return symbol;
}

function it_resolveAsMathSymbolLabel(symbol){
  var symbol_label = "";

  if(symbol==">"){
      symbol_label='maggiore di';
    }
    else if(symbol="<"){
      symbol_label='minore di';
    }
    else if(symbol=="="){
      symbol_label='uguale a';
    }

    return symbol_label;
}

function it_resolveAsOrder(superlative){
  var order = null;
  
  if(superlative=='minima' || superlative=='minore' || superlative == 'inferiore'){
      order='ASC'
  }
  else if(superlative=='massima' || superlative=='maggiore' || superlative == 'superiore'){
      order='DESC'
  }
  
  return order;
}

LanguageManager.resolveAsMathSymbol = function(current_lang, symbol_label){
  switch(current_lang){
    case 'it':
      return it_resolveAsMathSymbol(symbol_label);
    case 'en':
    default:
      return en_resolveAsMathSymbol(symbol_label);
  }

  return null;
}

LanguageManager.resolveAsMathSymbolLabel = function(current_lang, symbol){
  switch(current_lang){
    case 'it':
      return it_resolveAsMathSymbolLabel(symbol);
    case 'en':
    default:
      return en_resolveAsMathSymbolLabel(symbol);
  }

  return null;
}

LanguageManager.resolveAsOrder = function(current_lang, superlative){
  switch(current_lang){
    case 'it':
      return it_resolveAsOrder(superlative);
    case 'en':
    default:
      return en_resolveAsOrder(superlative);
  }

  return null;
}

LanguageManager.getFurtherDetails_noResults = function(current_lang){
  var response = ''; 

  switch(current_lang){
    case 'it':
      response = 'Scusa, ma non trovo alcun risultato relativo alla richiesta precedente.';
      break;
    case "en":
    default:
      response = 'Sorry, but I did not find any results in the previous query.';
      break;
  }

  return response;
}

LanguageManager.getFurtherDetails_noFurtherDetails = function(current_lang){
  var response = ''; 

  switch(current_lang){
    case 'it':
      response = 'Scusa, ma non trovo alcun ulterore dettaglio.';
      break;
    case "en":
    default:
      response = 'Sorry, but I did not find any further detail.';
      break;
  }

  return response;
}

LanguageManager.getLocation_request = function(current_lang, entity){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando dove si trova '+entity+". ";
      break;
    case "en":
    default:
      response = 'I looked for the location of '+entity+". ";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getNumericFilterByClass_request = function(current_lang, entity, prop, symbol, value){
  var response; 
  var symbol_label = LanguageManager.resolveAsMathSymbolLabel(current_lang, symbol);

  switch(current_lang){
    case "it":
      response = 'Sto cercando istanze di '+entity+' con ' + prop +" "+ symbol_label+" "+ value+". ";
      break;
    case "en":
    default:
      response = 'I looked for instances of '+entity+' that have ' + prop +" "+ symbol_label+" "+ value+". ";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getNumericFilter_request = function(current_lang, prop, symbol, value){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando tutti gli elementi che hanno ' + prop +" "+ symbol+" "+ value+". ";
      break;
    case "en":
    default:
      response = 'I looked for entities that have ' + prop +" "+ symbol+" "+ value+". ";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.img_response = function(current_lang, img_urls){
  var response; 

  switch(current_lang){
    case "it":
      if(img_urls== null || img_urls.length==0)
        response ="Scusa, ma non ho trovato alcuna immagine.";
      else if(img_urls.length==1)
        response = "Ecco cosa ho trovato: " + img_urls[0];
      else{
        response = "Ho trovato le seguenti immagini: " + img_urls.join(", ") ;
      }
      break;
    case "en":
    default:
      if(img_urls== null || img_urls.length==0)
        response ="Sorry! I did not find any image.";
      else if(img_urls.length==1)
        response = "It is " + img_urls[0];
      else{
        response = "I found these images: " + img_urls.join(", ") ;
      }
      break;
  }

  return response;

}

LanguageManager.boolean_response = function(current_lang, boolean_value){
  var response; 

  switch(current_lang){
    case "it":
      if(boolean_value)
        response = "è vero.";
      else
        response = "Credo sia falso.";
      break;
    case "en":
    default:
      if(boolean_value)
        response = "It is true.";
      else
        response = "I believe it is false.";
      break;
  }

  return response;

}

LanguageManager.results_response = function(current_lang, count, results){
  var response; 

  switch(current_lang){
    case "it":
      if(results==null || results.length==0){
        response = "Scusa, ma non so la risposta."
      }
      else{
        var results_as_string = results.join(", ");
        if(results.length==1){
          response = "La risposta è "+ results_as_string + ".";
        }
        else if(results.length==count){
          response = "Ho trovato "+ count+' risultati: ' + results_as_string+ ".";
        }
        else{
          response = "HO trovato "+ count+' risultati. Ecco i primi '+ results.length +': '+results_as_string+ ".";
        }
        response = removeSpecialCharacters(response);
      } 

      break;
    case "en":
    default:

      if(results==null || results.length==0){
        response = "Sorry I don't know the answer."
      }
      else{
        var results_as_string = results.join(", ");
        if(results.length==1){
          response = "It is "+ results_as_string + ".";
        }
        else if(results.length==count){
          response = "I found "+ count+' results: ' + results_as_string+ ".";
        }
        else{
          response = "I found "+ count+' results. Here the top '+ results.length +': '+results_as_string+ ".";
        }
        response = removeSpecialCharacters(response);
      } 

      break;
  }

  return response;

}

LanguageManager.getTripleVerification_request = function(current_lang, subj, prop, obj){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Ho verificato se ' + subj +" ha "+ prop+" uguale a " + obj+". ";
      break;
    case "en":
    default:
      response = 'I verified if ' + subj +" has "+ obj+" as "+ prop+". ";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getSuperlative_request = function(current_lang, entity, property, superlative){
  var response; 

  switch(current_lang){
    case "it":
      response = "Sto cercando quale " + entity + " ha " + property + " come valore " + superlative;
      break;
    case "en":
    default:
      response = 'I looked for ' + entity +" with "+ superlative+" value of "+ property+". ";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getImg_request = function(current_lang, entity){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando immagini relative a ' + entity +". Ecco cosa ho trovato.";
      break;
    case "en":
    default:
      response = 'I looked for an image related to ' + entity +". Here it is.";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getImg_unsoppertedDevice = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = "Non hai un dispositivo che permette di visualizzare immagini.";
      break;
    case "en":
    default:
      response = "You don't have a device that displays images.";
      break;
  }

  return response;
}

LanguageManager.getClassInstances_request = function(current_lang, entity){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando istanze di ' + entity +".";
      break;
    case "en":
    default:
      response = 'I looked for the instances of ' + entity +".";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getDescription_response = function(current_lang, descriptions){
  var response; 
  var descriptions_count = descriptions.length;

  switch(current_lang){
    case "it":
      if(descriptions_count==0)
        response = "Scusa, non ho trovato alcuna definizione.";
      else if(descriptions_count==1)
        response = "Può essere definito come "+ descriptions[0]+ ".";
      else{
        response = "Ho trovato " + descriptions_count +" definizioni.";
        var descriptions_as_string = descriptions.join(" o ");
        response += descriptions_as_string + ".";
      }
      break;
    case "en":
    default:
      if(descriptions_count==0)
        response = "Sorry! I did not found any definition for it.";
      else if(descriptions_count==1)
        response = "It can be defined as "+ descriptions[0]+ ".";
      else{
        response = "I found " + descriptions_count +" definitions.";
        var descriptions_as_string = descriptions.join(" or ");
        response += descriptions_as_string + ".";
      }
      break;
  }
  console.log("getDescription_response")
  console.log(response)
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getPropertySubject_request = function(current_lang, entity, property){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando cosa ha ' + property + " uguale a " + entity +".";
      break;
    case "en":
    default:
      response = 'I looked for entities whose ' + property + " is equals to " + entity +".";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getPropertySubjectByClass_request = function(current_lang, class_value, entity, property){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando istanze di '+ class_value +' che hanno ' + property + " uguale a " + entity +".";
      break;
    case "en":
    default:
      response = 'I looked for instances of '+ class_value +' whose ' + property + " is equals to " + entity +".";
      break;
  }
  response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getPropertyObject_request = function(current_lang, entity, property){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Sto cercando il valore della proprietà ' + property + " relativa all'entità " + entity +".";
      break;
    case "en":
    default:
      response = 'I looked for ' + property + " of " + entity +".";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.getDescription_request = function(current_lang, entity){
  var response; 
  switch(current_lang){
    case "it":
      response = "Sto cercando la descrizion relativa all'entità " + entity +".";
      break;
    case "en":
    default:
      response = 'I looked for the description of ' + entity +".";
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.reprompt = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'prova di nuovo, '
      break;
    case "en":
    default:
      response = 'try again, '
      break;
  }

  return response;
}

LanguageManager.reprompt_more_questions = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'qualche altra domanda?';
      break;
    case "en":
    default:
      response = 'more question?';
      break;
  }

  return response;
}

LanguageManager.more_questions = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = ' Hai altri domande?'
      break;
    case "en":
    default:
      response = ' Do you have more questions?'
      break;
  }

  return response;
}

LanguageManager.SessionEndedRequest = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = "Ciao ciao";
      break;
    case "en":
    default:
      response = 'bye bye';
      break;
  }

  return response;
}

LanguageManager.ErrorHandler = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = "Scusa, ma non so rispondere. Chiedimi qualcos'altro.";
      break;
    case "en":
    default:
      response = "Sorry I don't know the answer, ask me something else.";
      break;
  }

  return response;
}

LanguageManager.LaunchRequest = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Ciao!!' + ' Benvenuto in ' + invocationName + "! Chiedimi qualche curiosità, ad esempio: dammi la capitale dell'Italia";
      break;
    case "en":
    default:
      response = 'Hi!!' + ' Welcome to ' + invocationName + '! Ask me your curiosities, such as: what is the capital of Italy?';
      break;
  }
    response = removeSpecialCharacters(response);
  return response;
}

LanguageManager.StandardCard = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Benvenuto!', 'Ciao!\nEcco la tua skill, ' + skillTitle, welcomeCardImg.smallImageUrl, welcomeCardImg.largeImageUrl;
      break;
    case "en":
    default:
      response = 'Welcome!', 'Hi!\nThis is your skill, ' + skillTitle, welcomeCardImg.smallImageUrl, welcomeCardImg.largeImageUrl;
      break;
  }

  return response;
}

LanguageManager.CancelIntent = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = "OK! A dopo!";
      break;
    case "en":
    default:
      response = 'Okay, talk to you later! ';
      break;
  }

  return response;
}

LanguageManager.HelpIntent = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Hai chiesto aiuto. '; 
      response += "Ecco qualcosa che puoi chiedermi, chi è l'autore di harry potter?";
      break;
    case "en":
    default:
      response = 'You asked for help. '; 
      response += 'Here something you can ask me, who is the author of harry potter?';
      break;
  }

  return response;
}

LanguageManager.StopIntent = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Ok, a dopo! ';
      break;
    case "en":
    default:
      response = 'Okay, see you soon! ';
      break;
  }

  return response;
}

LanguageManager.NavigateHomeIntent = function(current_lang){
  var response; 

  switch(current_lang){
    case "it":
      response = 'Ciao da AMAZON.NavigateHomeIntent. ';
      break;
    case "en":
    default:
      response = 'Hello from AMAZON.NavigateHomeIntent. ';
      break;
  }

  return response;
}

// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
    .addRequestHandlers(
        AMAZON_CancelIntent_Handler, 
        AMAZON_HelpIntent_Handler, 
        AMAZON_StopIntent_Handler, 
        AMAZON_NavigateHomeIntent_Handler, 
        getPropertyObject_Handler, 
        getDescription_Handler,
        getLocation_Handler, 
        getSuperlative_Handler,
        getImg_Handler,
        getClassInstances_Handler,
        getPropertySubjectByClass_Handler,
        getPropertySubject_Handler,
        getNumericFilter_Handler,
        getNumericFilterByClass_Handler,
        getTripleVerification_Handler,
        LaunchRequest_Handler, 
        SessionEndedHandler,
        getAllResultsPreviousQuery_Handler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitMemoryAttributesInterceptor)
    .addRequestInterceptors(RequestHistoryInterceptor)


    .lambda();