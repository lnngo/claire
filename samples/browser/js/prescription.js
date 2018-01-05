function prescription_module(action, settings, categorized){
  var intent = "";
 // var prescription = {"patient": "", "medication": "", "duration": "", "directions": ""};
  
  if(action == 'none'){
    return "prescription module selected";
  }if(action == 'cancel' || action == 'complete'){
    prescription = {"patient": "", "medication": "", "duration": "", "directions": ""};
    if(action == 'complete'){
      return "Prescription sent. "
    }
  }else if (action == 'create'){
    if(prescription["patient"].length > 0 && prescription["medication"].length > 0 && prescription["duration"].length > 0){
      for(var i = 0; i < settings.length; i++){
        prescription["directions"] += settings[i]["text"]["content"] + " ";
      }
    }else{
      if(prescription["patient"].length == 0 && prescription["medication"].length == 0 && prescription["duration"].length == 0){
        intent = "Prescription creation initialized. ";
      }
      for(var i = 0; i < settings.length; i++){
        if($.inArray(i, categorized) == -1){
          var token = settings[i];
         // console.log(token["text"]["content"]);
          if(token["partOfSpeech"]["tag"] == "NUM" || token["partOfSpeech"]["tag"].indexOf("CD") >= 0 ){
            var dependency_head = i + 1;
            prescription["duration"] += token["text"]["content"] + " " + settings[dependency_head]["text"]["content"];
            categorized.push(i);
            categorized.push(dependency_head);
          }
          else if(token["partOfSpeech"]["proper"] == "PROPER" || token["partOfSpeech"]["tag"].indexOf("NNP") >= 0){
            var endOfSettings = settings.length - i < 5 ? settings.length - i : 5;
            var patientMatch = searchPatientName(settings.slice(i, i + endOfSettings));
            if(patientAjax > 0){
              return "";
            }
          }
          else if(token["partOfSpeech"]["tag"] == "NOUN" || token["partOfSpeech"]["tag"].indexOf("NN") >= 0){
            prescription["medication"] += token["lemma"];
            categorized.push(i);
          }
        }
      }
    }
  }else{
    intent ="action not recognized in module";
  }
  return intent + checkPrescription();
}

function checkPrescription(){
  intent = "";
  if(prescription["patient"].length > 0 && prescription["medication"].length > 0 && prescription["duration"].length > 0){
    intent = "Prescription created: ";
    for(var i in prescription){
      if(prescription[i] != ""){
        intent += "<br />" + i + ": " + prescription[i];
      }
    }
    
    if(prescription["directions"] == ""){ 
      intent += "<br /><br /> Please specify directions";
    }else{
      intent += "<br /><br /> Send or cancel?";
    }
  }else{
    var missing = "";
    if(prescription["patient"] == ""){
      missing += "patient";
    }
    if(prescription["medication"] == ""){
      if(missing.length > 0)
        missing += ", "
      missing += "medication";
    }
    if(prescription["duration"] == ""){
      if(missing.length > 0)
        missing += ", "
      missing += "duration";
    }
    if(missing.length > 0){
      intent += "Please specify " + missing + "."
    }
  }
  return intent;
}