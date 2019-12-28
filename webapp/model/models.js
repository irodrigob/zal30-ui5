sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/m/MessageToast"
], function (JSONModel, Device, MessageToast, Filter) {
	"use strict";
	//////////////////////////////////
	//                              //
	//      Internal properties     //
	//                              //
	//////////////////////////////////
	var _sLanguage,
		_bMock = true,
		_aoModel = [],
		_sToken = undefined,
		_oMockDataModel = new JSONModel(),
		_baseDir;

	//////////////////////////////////
	//                              //
	//        List of services      //
	//                              //
	//////////////////////////////////
	var _mService = {
		getViews: {
			serviceName: "/getViews",
			bUseMock: true,
			mockFile: "/getViews.json",
			oDataModel: "views"
		}
	};

	//////////////////////////////////
	//                              //
	//        Public methods        //
	//                              //
	//////////////////////////////////
	var oBaseModelHandler = {

		getModel: function (sModel) {
			var aoModel = _aoModel.filter(function (oModel) {
				return oModel.name === sModel;
			});

			return aoModel[0].model;
		},

		getOdatalUrl: function (sModelName) {
			return this.getModel(sModelName).sServiceUrl;
		},

		getBaseServices: function () {
			return _mService;
		},

		setConfig: function (aoModels, sLang, sMock) {
			_aoModel = aoModels,
				_sLanguage = sLang;
			oBaseModelHandler.setMockMode(sMock);
		},

		getMock: function () {
			return _bMock;
		},

		setBaseDir: function (sDir) {
			_baseDir = sDir;
		},

		setMockMode: function (sMock) {
			var bMock;
			switch (sMock) {
				case "true":
					sap.m.MessageToast.show("Running on MOCK");
					bMock = true;
					break;
				case "mix":
					sap.m.MessageToast.show("Running on MIX mock");
					bMock = undefined;
					break;
				default:
					bMock = false;
			}
			_bMock = bMock;
		},

		loadMockData: function (oServiceConfig, oParam) {
			_oMockDataModel.loadData(jQuery.sap.getModulePath(_baseDir) + oServiceConfig.mockFile, undefined, false);
			if (oParam.success) {
				oParam.success(_oMockDataModel.getData());
			}
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////		  
		getViews: function (oParameters, successHandler, errorHandler) {

		}
	};

	return oBaseModelHandler;
});
