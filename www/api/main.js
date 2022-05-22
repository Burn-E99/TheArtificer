// deno-lint-ignore-file
// Hide nojs notification and show tools
document.getElementById("nojs").className = "hidden";
document.getElementById("js").className = "";

var apiField = document.getElementById("api-field");
var userField = document.getElementById("user-field");
var channelField = document.getElementById("channel-field");
var emailField = document.getElementById("email-field");
var deleteField = document.getElementById("delete-field");
var submitField = document.getElementById("submit-field");

var endpoint = "none";
var apiStatus = "activate";

// Checks if all fields needed for the selected endpoint are valid
function validateFields() {
	if (!(userField.value > 0 && userField.checkValidity())) {
		submitField.disabled = true;
		return;
	}
	switch (endpoint) {
		case "generate":
			if (!(emailField.value.length > 0 && emailField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			break;
		case "delete":
			if (!(apiField.value.length > 0 && apiField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			if (!(emailField.value.length > 0 && emailField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			break;
		case "view":
			if (!(apiField.value.length > 0 && apiField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			break;
		case "add":
		case "activate":
			if (!(apiField.value.length > 0 && apiField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			if (!(channelField.value > 0 && channelField.checkValidity())) {
				submitField.disabled = true;
				return;
			}
			break;
		default:
			break;
	}
	
	submitField.disabled = false;
}

// Shows appropriate fields for selected endpoint
function showFields() {
	document.getElementById("fields").className = "";

	endpoint = this.value;

	switch (endpoint) {
		case "generate":
			document.getElementById("api-field-group").className = "hidden";
			document.getElementById("channel-field-group").className = "hidden";
			document.getElementById("active-field-group").className = "hidden";
			document.getElementById("email-field-group").className = "field-group";
			document.getElementById("delete-field-group").className = "hidden";
			break;
		case "delete":
			document.getElementById("api-field-group").className = "field-group";
			document.getElementById("channel-field-group").className = "hidden";
			document.getElementById("active-field-group").className = "hidden";
			document.getElementById("email-field-group").className = "field-group";
			document.getElementById("delete-field-group").className = "field-group";
			break;
		case "view":
			document.getElementById("api-field-group").className = "field-group";
			document.getElementById("channel-field-group").className = "hidden";
			document.getElementById("active-field-group").className = "hidden";
			document.getElementById("email-field-group").className = "hidden";
			document.getElementById("delete-field-group").className = "hidden";
			break;
		case "add":
			document.getElementById("api-field-group").className = "field-group";
			document.getElementById("channel-field-group").className = "field-group";
			document.getElementById("active-field-group").className = "hidden";
			document.getElementById("email-field-group").className = "hidden";
			document.getElementById("delete-field-group").className = "hidden";
			break;
		case "activate":
			document.getElementById("api-field-group").className = "field-group";
			document.getElementById("channel-field-group").className = "field-group";
			document.getElementById("active-field-group").className = "field-group";
			document.getElementById("email-field-group").className = "hidden";
			document.getElementById("delete-field-group").className = "hidden";
			break;
		default:
			break;
	}

	validateFields();
}

// Sets the status for channel activation/deactivation
function setStatus() {
	apiStatus = this.value;
}

// Sends the request
function sendPayload() {
	document.getElementById("results").className = "";

	var xhr = new XMLHttpRequest();
	var method;
	var path = "/api/";

	switch (endpoint) {
		case "generate":
			method = "GET";
			path += "key?user=" + userField.value + "&email=" + emailField.value;
			break;
		case "delete":
			method = "DELETE";
			path += "key?user=" + userField.value + "&email=" + emailField.value + (deleteField.value.length > 0 ? ("&code=" + deleteField.value) : "");
			break;
		case "view":
			method = "GET";
			path += "channel?user=" + userField.value;
			break;
		case "add":
			method = "POST";
			path += "channel/add?user=" + userField.value + "&channel=" + channelField.value;
			break;
		case "activate":
			method = "PUT";
			path += "channel/" + apiStatus + "?user=" + userField.value + "&channel=" + channelField.value;
			break;
		default:
			return;
	}

	xhr.open(method, path);

	if (endpoint !== "generate") {
		xhr.setRequestHeader("X-Api-Key", apiField.value);
	}

	xhr.send();

	xhr.onload = function() {
		document.getElementById("status").innerText = xhr.status;
		document.getElementById("body").innerText = xhr.response;

		switch (endpoint) {
			case "generate":
				document.getElementById("desc").innerHTML = "If you got a 200 OK, everything is set.  Your API Key will be emailed to you within 24 hours.<br/>If you did not get a 200 OK, make sure all information entered is correct.";
				break;
			case "delete":
				document.getElementById("desc").innerHTML = "If you got a 200 OK, everything is deleted.<br/>If you got a 424 Failed dependancy, this means you need a delete code before you can procede. Running this endpoint without the code provided will generate one and it will be emailed to you within 24 hours.<br/>If you did not get either of these, make sure all information entered is correct.";
				break;
			case "view":
				document.getElementById("desc").innerHTML = "If you got a 200 OK, everything is set.<br/>If you did not get a 200 OK, make sure all information entered is correct.";
				break;
			case "add":
				document.getElementById("desc").innerHTML = "If you got a 200 OK, everything is set.<br/>If you did not get a 200 OK, make sure all information entered is correct.";
				break;
			case "activate":
				document.getElementById("desc").innerHTML = "If you got a 200 OK, everything is set.<br/>If you did not get a 200 OK, make sure all information entered is correct.";
				break;
			default:
				document.getElementById("desc").innerHTML = "What? This shouldn't be possible";
				break;
		}
	};

}

// Attach functions to html attributes
document.getElementById("endpointDropdown").addEventListener("change", showFields);
document.getElementById("active-field").addEventListener("change", setStatus);
apiField.addEventListener("input", validateFields);
userField.addEventListener("input", validateFields);
channelField.addEventListener("input", validateFields);
emailField.addEventListener("input", validateFields);
deleteField.addEventListener("input", validateFields);
submitField.addEventListener("click", sendPayload);
