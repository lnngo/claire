var langs =
[['Afrikaans',       ['af-ZA']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['CatalÃ ',          ['ca-ES']],
 ['ÄŒeÅ¡tina',         ['cs-CZ']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-NZ', 'New Zealand'],
                     ['en-ZA', 'South Africa'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['EspaÃ±ol',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'EspaÃ±a'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'MÃ©xico'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'PanamÃ¡'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'PerÃº'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'RepÃºblica Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['FranÃ§ais',        ['fr-FR']],
 ['Galego',          ['gl-ES']],
 ['Hrvatski',        ['hr_HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Ãslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['Magyar',          ['hu-HU']],
 ['Nederlands',      ['nl-NL']],
 ['Norsk bokmÃ¥l',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['PortuguÃªs',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['RomÃ¢nÄƒ',          ['ro-RO']],
 ['SlovenÄina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['TÃ¼rkÃ§e',          ['tr-TR']],
 ['Ð±ÑŠÐ»Ð³Ð°Ñ€ÑÐºÐ¸',       ['bg-BG']],
 ['PÑƒÑÑÐºÐ¸Ð¹',         ['ru-RU']],
 ['Ð¡Ñ€Ð¿ÑÐºÐ¸',          ['sr-RS']],
 ['í•œêµ­ì–´',            ['ko-KR']],
 ['ä¸­æ–‡',             ['cmn-Hans-CN', 'æ™®é€šè¯ (ä¸­å›½å¤§é™†)'],
                     ['cmn-Hans-HK', 'æ™®é€šè¯ (é¦™æ¸¯)'],
                     ['cmn-Hant-TW', 'ä¸­æ–‡ (å°ç£)'],
                     ['yue-Hant-HK', 'ç²µèªž (é¦™æ¸¯)']],
 ['æ—¥æœ¬èªž',           ['ja-JP']],
 ['Lingua latÄ«na',   ['la']]];


// On document load resolve the SDK dependency
function Initialize(onComplete) {
    require(["Speech.Browser.Sdk"], function(SDK) {
        onComplete(SDK);
    });
}

// Setup the recognizer
function RecognizerSetup(SDK, recognitionMode, language, format, subscriptionKey) {
    
    switch (recognitionMode) {
        case "Interactive" :
            recognitionMode = SDK.RecognitionMode.Interactive;    
            break;
        case "Conversation" :
            recognitionMode = SDK.RecognitionMode.Conversation;    
            break;
        case "Dictation" :
            recognitionMode = SDK.RecognitionMode.Dictation;    
            break;
        default:
            recognitionMode = SDK.RecognitionMode.Interactive;
    }

    var recognizerConfig = new SDK.RecognizerConfig(
        new SDK.SpeechConfig(
            new SDK.Context(
                new SDK.OS(navigator.userAgent, "Browser", null),
                new SDK.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
        recognitionMode,
        language, // Supported languages are specific to each recognition mode. Refer to docs.
        format); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)

    // Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
    var authentication = new SDK.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

    return SDK.CreateRecognizer(recognizerConfig, authentication);
}

// Start the recognition
function RecognizerStart(SDK, recognizer) {
    recognizer.Recognize((event) => {
        /*
         Alternative syntax for typescript devs.
         if (event instanceof SDK.RecognitionTriggeredEvent)
        */
        switch (event.Name) {
            case "RecognitionTriggeredEvent" :
                UpdateStatus("Initializing");
                new_recording = false;
                break;
            case "ListeningStartedEvent" :
                UpdateStatus("Listening");
                break;
            case "RecognitionStartedEvent" :
                UpdateStatus("Listening_Recognizing");
                break;
            case "SpeechStartDetectedEvent" :
                UpdateStatus("Listening_DetectedSpeech_Recognizing");
                break;
            case "SpeechHypothesisEvent" :
                UpdateRecognizedHypothesis(event.Result.Text, false);
                break;
            case "SpeechFragmentEvent" :
                UpdateRecognizedHypothesis(event.Result.Text, true);
                break;
            case "SpeechEndDetectedEvent" :
                UpdateStatus("Processing_Adding_Final_Touches");
                break;
            case "SpeechSimplePhraseEvent" :
                UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));
                break;
            case "SpeechDetailedPhraseEvent" :
                UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));
                break;
            case "RecognitionEndedEvent" :
                OnComplete(event.Result);
                UpdateStatus("Idle");
                break;
            default:
                //console.log(JSON.stringify(event)); // Debug information
        }
    })
    .On(() => {
        // The request succeeded. Nothing to do here.
    },
    (error) => {
        console.error(error);
    });
}

// Stop the Recognition.
function RecognizerStop(SDK, recognizer) {
    // recognizer.AudioSource.Detach(audioNodeId) can be also used here. (audioNodeId is part of ListeningStartedEvent)
    recognizer.AudioSource.TurnOff();
}

// Browser Hooks

var createBtn, startBtn, stopBtn, hypothesisDiv, phraseDiv, statusDiv, resultsDiv;
var key, languageOptions, formatOptions, recognitionMode, inputSource, filePicker;
var SDK;
var recognizer;
var new_recording = true;
var previousSubscriptionKey;
var recognizing = false;

document.addEventListener("DOMContentLoaded", function () {
    startBtn = document.getElementById("start_button");
    phraseDiv = document.getElementById("final_span");
    hypothesisDiv = document.getElementById("interim_span");
    statusDiv = document.getElementById("info_status");
    resultsDiv = document.getElementById("interpretation");
    key = document.getElementById("key");
    languageOptions = document.getElementById("select_dialect");
    formatOptions = document.getElementById("formatOptions");
    inputSource = document.getElementById("inputSource");
    recognitionMode = document.getElementById("recognitionMode");

    languageOptions.addEventListener("change", Setup);
    formatOptions.addEventListener("change", Setup);
    recognitionMode.addEventListener("change", Setup);

    startBtn.addEventListener("click", function () {
        if(recognizing){
            RecognizerStop(SDK, recognizer);
            recognizing = false;
            return;
        }
  
        if (key.value == "" || key.value == "YOUR_BING_SPEECH_API_KEY") {
            alert("Please enter your Bing Speech subscription key!");
            return;
        }
        if (!recognizer || previousSubscriptionKey != key.value) {
            previousSubscriptionKey = key.value;
            Setup();
        }

        hypothesisDiv.innerHTML = "";
        phraseDiv.innerHTML = "";
        recognizing = true;
        RecognizerStart(SDK, recognizer);
    });

    Initialize(function (speechSdk) {
        SDK = speechSdk;
    });
});

function Setup() {
    recognizer = RecognizerSetup(SDK, recognitionMode.value, languageOptions.value, SDK.SpeechResultFormat[formatOptions.value], key.value);
}

function UpdateStatus(status) {
    statusDiv.innerHTML = status;
}

function UpdateRecognizedHypothesis(text, append) {
    if (append) 
        hypothesisDiv.innerHTML += text + " ";
    else 
        hypothesisDiv.innerHTML = text;

    var length = hypothesisDiv.innerHTML.length;
    if (length > 403) {
        hypothesisDiv.innerHTML = "..." + hypothesisDiv.innerHTML.substr(length-400, length);
    }
}

function UpdateRecognizedPhrase(json) {
    var res = JSON.parse(json);
    
    if(res["RecognitionStatus"] == "Success"){
        hypothesisDiv.innerHTML = "";
        phraseDiv.innerHTML += res["DisplayText"] + "\n";
        analyzeSyntax(res);
    }
}

function OnComplete(event) {
    new_recording = true;
   // if(recognizing)
   //    startBtn.click();
}


for (var i = 0; i < langs.length; i++) {
  select_language.options[i] = new Option(langs[i][0], i);
}
select_language.selectedIndex = 6;
updateCountry();
select_dialect.selectedIndex = 6;
showInfo('info_start');

function updateCountry() {
  for (var i = select_dialect.options.length - 1; i >= 0; i--) {
    select_dialect.remove(i);
  }
  var list = langs[select_language.selectedIndex];
  for (var i = 1; i < list.length; i++) {
    select_dialect.options.add(new Option(list[i][1], list[i][0]));
  }
  select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

function upgrade() {
  start_button.style.visibility = 'hidden';
  showInfo('info_upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function showInfo(s) {
  if (s) {
    for (var child = info.firstChild; child; child = child.nextSibling) {
      if (child.style) {
        child.style.display = child.id == s ? 'inline' : 'none';
      }
    }
    info.style.visibility = 'visible';
  } else {
    info.style.visibility = 'hidden';
  }
}

function analyzeSyntax(command){

    var api_key = "6e9c05c81f1641899e23bb1391e4bb75";
    var app_id = "9895f32b-c97a-4d86-9ab1-57810d854e0d";
    
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/"+ app_id + "?staging=true&q=" + command["DisplayText"],
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", api_key);
        },
        type: "GET",
        data: "",
    })
    .done(function(data) {
        console.log(data);
       if(data["topScoringIntent"]["intent"] == "CreateRx"){
           prescription_module('create', '', []);
       }
       tokenize(command);
       //resultsDiv.innerHTML = data["query"] + "<br /><br />" + resultsDiv.innerHTML;
    })
    .fail(function() {
        alert("error");
    });
    
}

function tokenize(command){
     $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/linguistics/v1.0/analyzers",
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "cda6037c9f5d4334bbc0c5e5311ce012");
        },
        type: "GET",
        data: "",
    }).done(function(data1) {
        var analyzersIDs = [];
        var analyzers = {};
    
        for(var i = 0; i < data1.length; i++){
            if(data1[i]["kind"] == "Tokens" || data1[i]["kind"] == "POS_Tags"){
                analyzersIDs.push(data1[i]["id"]);
                analyzers[data1[i]["kind"]] = data1[i]["id"];
            }
        }
        var nlpData = {
        	"language" : "en",
        	"analyzerIds" : analyzersIDs,
        	"text" :  command["DisplayText"]
        }
        
        $.ajax({
            url: "https://westus.api.cognitive.microsoft.com/linguistics/v1.0/analyze",
            beforeSend: function(xhrObj){
                // Request headers
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "cda6037c9f5d4334bbc0c5e5311ce012");
            },
            type: "POST",
            data: JSON.stringify(nlpData)
        }).done(function(data2){
            var tokens, pos;
            for(var i = 0; i < data2.length; i++){
                if(data2[i]["analyzerId"] == analyzers["Tokens"]){
                    tokens = data2[i]["result"][0]["Tokens"];   
                }
                else if(data2[i]["analyzerId"] == analyzers["POS_Tags"]){
                    pos = data2[i]["result"][0];   
                }
            }
            
            var nlp = { tokens: [] };
            for(var j = 0; j < tokens.length; j++){
                var temp = {};
                temp["partOfSpeech"] = { tag: pos[j] };
                temp["lemma"] = tokens[j]["NormalizedToken"];
                temp["text"] = { content: tokens[j]["RawToken"] };
                
                nlp['tokens'].push(temp);
            }
            parseResponse(nlp);
           //resultsDiv.innerHTML = data["query"] + "<br /><br />" + resultsDiv.innerHTML;
        });
    }).fail(function() {
        alert("error");
    });
}
