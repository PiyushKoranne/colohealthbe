var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
var utils = require('../utils.js');
var constants = require('../constants.js');


function getAnAcceptPaymentPage(callback, regId, paymentVerificationToken) {

	console.log("Generate payment acceptance form");
	var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(constants.apiLoginKey);
	merchantAuthenticationType.setTransactionKey(constants.transactionKey);

	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(utils.getRandomAmount());

	var setting1 = new ApiContracts.SettingType();
	setting1.setSettingName('hostedPaymentButtonOptions');
	setting1.setSettingValue('{\"text\": \"Pay\"}');

	var setting2 = new ApiContracts.SettingType();
	setting2.setSettingName('hostedPaymentOrderOptions');
	setting2.setSettingValue('{\"show\": false}');

	var setting3 = new ApiContracts.SettingType();
	setting3.setSettingName('hostedPaymentReturnOptions');
	setting3.setSettingValue(`{"showReceipt": false, "url": "http://174.138.76.145/thank-you?regid=${regId+'__pv__'+paymentVerificationToken}", "urlText": "Return to your site", "cancelUrl": "http://174.138.76.145/?regid=${regId})"}`);

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);
	 settingList.push(setting3);

	var alist = new ApiContracts.ArrayOfSetting();
	alist.setSetting(settingList);

	var getRequest = new ApiContracts.GetHostedPaymentPageRequest();
	getRequest.setMerchantAuthentication(merchantAuthenticationType);
	getRequest.setTransactionRequest(transactionRequestType);
	getRequest.setHostedPaymentSettings(alist);

	var ctrl = new ApiControllers.GetHostedPaymentPageController(getRequest.getJSON());

	ctrl.execute(function () {
		var apiResponse = ctrl.getResponse();
		var response = new ApiContracts.GetHostedPaymentPageResponse(apiResponse);
		if (response != null) {
			if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
				console.log('Hosted payment page token :');
				callback(null, {token: response.getToken(), regid: regId});
			} else {
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
				callback(new Error(response.getMessages().getMessage()[0].getText()));
			}
		} else {
			console.log('Null response received');
			callback(new Error('Null response received'));
		}
		
	});
}

module.exports = getAnAcceptPaymentPage;
