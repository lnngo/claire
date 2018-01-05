function patient_module(action, settings, categorized){
  if(action == 'none'){
    return "prescription module selected";
  }if(action == 'cancel' || action == 'complete'){
    prescription = {"patient": "", "medication": "", "duration": "", "directions": ""};
    if(action == 'complete'){
      return "Prescription sent. "
    }
  }else if (action == 'search'){
    for(var i = 0; i < settings.length; i++){
        if($.inArray(i, categorized) == -1){
          var token = settings[i];
          if(token["partOfSpeech"]["proper"] == "PROPER" || token["partOfSpeech"]["tag"].indexOf("NNP") >= 0){
            var endOfSettings = settings.length - i < 5 ? settings.length - i : 5;
            var patientMatch = searchPatientName(settings.slice(i, i + endOfSettings));
            if(patientAjax > 0){
              return "";
            }
          }
        }
      }
  }
}

function searchPatientName(settingsPatName){
  var properNounArray = [];
  var patientList = [];
  for(var i = 0; i < settingsPatName.length; i++){
    var token = settingsPatName[i];
    if(token["partOfSpeech"]["proper"] == "PROPER" || token["partOfSpeech"]["tag"].indexOf("NNP") >= 0){
      properNounArray.push(token["lemma"]);
      //search each proper noun for first and last name matches
      searchPatientSoap(token["lemma"],"", maxSoapReturn, patientList, properNounArray);
      searchPatientSoap("",token["lemma"], maxSoapReturn, patientList, properNounArray);
    }
  }
  
}

function searchPatientSoap(firstName, lastName, max, patientList, properNounArray){
  var soap =  '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.oscarehr.org/">';
    soap +=   '<soapenv:Header><wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">';
    soap +=   '<wsse:UsernameToken wsu:Id="UsernameToken-FDC3888062619D94BC146419195022631"><wsse:Username>-1</wsse:Username>';
    soap +=   '<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">Temp1234</wsse:Password>';
    soap +=   '</wsse:UsernameToken></wsse:Security></soapenv:Header><soapenv:Body><ws:searchDemographicByName>';
    soap +=   '<arg0>' + lastName + ', ' + firstName + '</arg0>';
    soap +=   '<arg1>0</arg1><arg2>' + max + '</arg2></ws:searchDemographicByName></soapenv:Body></soapenv:Envelope>';
    
    patientAjax++;
    $.ajax({
			url: 'https://66.207.221.212:8080/oscar/ws/DemographicService?', 
			type: "POST",
			cache : false,
			dataType: "xml", 
			data: soap, 
			contentType: "text/xml; charset=\"utf-8\"",
		}).done(function(data){
		  patientAjax--;
			
			for(var i = 0; i < data.getElementsByTagName("return").length; i++){
			  var exists = false;
			  var patient = {"priority": 0, "name":"", "emrID": "", "dob":"", "sex":"", "hin":""}
				var patientXML = data.getElementsByTagName("return")[i];
				
        //if demographic number comes up more than once, increase the priority
				for(var pat in patientList){
				  if(patientList[pat]["emrID"] == patientXML.getElementsByTagName("demographicNo")[0].innerHTML){
				    patientList[pat]["priority"]++;
				    exists = true;
				  }
				}
				
  			if(!exists){
  				patient["name"] = patientXML.getElementsByTagName("displayName")[0].innerHTML;
  				patient["emrID"] = patientXML.getElementsByTagName("demographicNo")[0].innerHTML;
  				patient["dob"] = patientXML.getElementsByTagName("yearOfBirth")[0].innerHTML + "-" + patientXML.getElementsByTagName("monthOfBirth")[0].innerHTML + "-" + patientXML.getElementsByTagName("dateOfBirth")[0].innerHTML ;
  				patient["sex"] = patientXML.getElementsByTagName("sex")[0].innerHTML;
  				patient["hin"] = patientXML.getElementsByTagName("hin")[0].innerHTML;
  				
				  patientList.push(patient);
  			}
			}
			if(patientAjax == 0){
			  if(patientList.length == 0){ //change these to be switch case by module
			    noPatientResults(properNounArray);
			  }else if(patientList.length == 1){
			    prescription["patient"] = patientList[0]["name"];
			  }else{
			    showPatientSelect(patientList);
			  }
			}
		});
}

function noPatientResults(properNounArray){
  switch (context) {
    case 'appointment':
      //what other checks for proper nouns?
      break;
    case 'prescription':
      //check if medication
      break;
    case 'master':
      //what other checks for proper nouns?
      break;
    default:
      return "Names not recognized";
    }
}

function showPatientSelect(patientList){
  var response = "<div>Please confirm patient:</div>";
  
  for(var i = 0; i < patientList.length; i++){
    response += "<div class='claireOption' emrID='" + patientList[i]["emrID"];
    response += "' onclick='patientSelected(this"+ patientList[i] +")'>" + patientList[i]["name"] + "</div>";
  }
  printClaireResponse(response);
}

function patientSelected(claireOption, patient){
    var $choices = $(claireOption).parent();
    var emrID = $(claireOption).attr("emrid");
    
    //$choices.children("[emrid!="+emrID+"]").fadeOut(500);  //not working for some reason. Testing determines that jquery is valid
    $choices.children("[emrid!="+emrID+"]").hide();
    
    switch (context) {
    case 'appointment':
      printClaireResponse($(claireOption).html() + " selected");
      break;
    case 'prescription':
      prescription["patient"] = $(claireOption).html();
      printClaireResponse(checkPrescription());
      break;
    case 'master':
      showMasterFile(patient);
      break;
    default:
      printClaireResponse($(claireOption).html() + " selected");
    }
}

function showMasterFile(patient){
  var $patientInfo_template = $("#patientInfo_template").clone();
  $patientInfo_template.attr("id", "patientInfo_" + patient["emrID"]);
  $patientInfo_template.find(".patientInfo_name").html(patient["name"]);
  $patientInfo_template.find(".patientInfo_dob").html(patient["dob"]);
  $patientInfo_template.find(".patientInfo_age").html("27");
  $patientInfo_template.find(".patientInfo_address").html("77 Parkwoods Village Dr. <br/> Apartment 314 <br /> North York, ON M3A2Y3");
  $patientInfo_template.find(".patientInfo_sex").html(patient["sex"]);
  $patientInfo_template.find(".patientInfo_phone").html("226-600-4992");
  
  printClaireResponse($patientInfo_template.html());
}