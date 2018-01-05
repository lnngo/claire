var action = "none";
var context = "none";
var prescription = {"patient": "", "medication": "", "duration": "", "directions": ""};
var maxSoapReturn = 6;
var patientAjax = 0;

function parseResponse(data){
  var html = "<div class='newLine'><div class='userText'>";
  
  for(var i = 0; i < data["tokens"].length; i++){
    var token = data["tokens"][i];
    if(token["partOfSpeech"]["tag"] == "VERB" || token["partOfSpeech"]["tag"].indexOf("VB") >= 0 )
      html += "<span style='color:red' title='" + token["lemma"] + "'>" + token["text"]["content"] + "</span> ";
    else if(token["partOfSpeech"]["tag"] == "NOUN" || token["partOfSpeech"]["tag"].indexOf("NN") >= 0 )
      html += "<span style='color:blue' title='" + token["lemma"] + "'>" + token["text"]["content"] + "</span> ";
    else if(token["partOfSpeech"]["tag"] == "NUM" || token["partOfSpeech"]["tag"].indexOf("CD") >= 0 )
      html += "<span style='color:white' title='" + token["lemma"] + "'>" + token["text"]["content"] + "</span> ";
    else if(token["partOfSpeech"]["tag"] != "DET" || token["partOfSpeech"]["tag"].indexOf("DT") < 0 )
      html += "<span style='color:black' title='" + token["partOfSpeech"]["tag"] + ": " + token["lemma"] + "'>" + token["text"]["content"] + "</span> ";
    else
      html += "<span style='color:grey'>" + token["text"]["content"] + "</span> ";
    //console.log(token);
  }
  html +="</div></div>"
  html += $("#interpretation").html();
  
  $("#interpretation").html(html);
  
  var responseText = "";
  if(token["partOfSpeech"]["tag"] != "DET" || token["partOfSpeech"]["tag"].indexOf("DT") < 0 )  
    responseText += parseIntent(data["tokens"]);
  if(responseText.length > 0)
    printClaireResponse(responseText);
  
}



function parseIntent(tokens){ //finds a matching function
  var categorized = [];
  for(var i = 0; i < tokens.length; i++){
    var token = tokens[i];
    for(var j = 0; j < contextKeys.length; j++){
      if(contextKeys[j]['key'] == token['lemma'].toLocaleLowerCase()){
        context = contextKeys[j]['context'];
        categorized.push(i);
        break;
      }
    }
    for(var j = 0; j < actionKeys.length; j++){
       if(actionKeys[j]['key'] == token['lemma'].toLocaleLowerCase()){
        action = actionKeys[j]['action'];
        categorized.push(i);
        break;
      }
    }
  }
  return executeIntent(action, context, tokens, categorized);
}

function executeIntent(action, context, settings, categorized){
  var intent = "";
  
  if(action == "exit")
    return "exit all modules"
  
  switch (context) {
    case 'appointment':
      intent = "appointment module selected";
      break;
    case 'prescription':
      intent = prescription_module(action, settings, categorized);
      break;
    case 'master':
      intent = patient_module(action, settings, categorized);
      break;
    default:
      if(action != "none" && action != "exit")
        intent = "no module found. Please specify";
  }
  
  return intent;
}

function printClaireResponse(printHtml){
  var response = "<div class='newLine'><div class='claireText'>" + printHtml + "</div></div>";
  $("#interpretation").html(response + $("#interpretation").html());
}

var contextKeys = [
    {key: 'home', context: 'none'},
    {key: 'appointment', context: 'appointment' },
    {key: 'prescription', context: 'prescription' },
    {key: 'patient', context: 'master' }];
    
var actionKeys = [
    {key: 'create', action: "create"},
    {key: 'make', action: "create"},
    {key: 'close', action: "exit"},
    {key: 'exit', action: "exit"},
    {key: 'cancel', action: "cancel"},
    {key: 'complete', action: 'complete'},
    {key: 'finish', action: 'complete'},
    {key: 'send', action: 'complete'},
    {key: 'ok', action: 'complete'},
    {key: 'okay', action: 'complete'},
    {key: 'search', action: 'search'},
    {key: 'find', action: 'search'},
  ];