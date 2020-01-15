sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (Object, JSONModel, merge, Filter, constants) {
	"use strict";

	return Object.extend("com.ivancio.zal30-ui5.service.CoreService", {

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		constructor: function (oComponent, mConf) {

			// Se inicializan las variables locales que son necesarias para acceder al modelo de datos
			this._oOwnerComponent = oComponent;
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");
			this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();

			// Llamada al metodo padre
			Object.call(this);

			// Se guarda la configuración pasada por parámetro
			this._setConfiguration(mConf);

		},

		getModel: function (sModel) {
			var aoModel = this._aoModel.filter(function (oModel) {
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
			this._aoModel = aoModels,
				this._sLanguage = sLang;
			this.setMockMode(sMock);
		},

		getMock: function () {
			return this._bMock;
		},

		setBaseDir: function (sDir) {
			this._baseDir = sDir;
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
			this._bMock = bMock;
		},

		loadMockData: function (oServiceConfig, oParam) {
			this._oMockDataModel.loadData(jQuery.sap.getModulePath(_baseDir) + oServiceConfig.mockFile, undefined, false);
			if (oParam.success) {
				oParam.success(this._oMockDataModel.getData());
			}
		},
		/** @param {object} oServiceConfig: Contains the below properties
		 * @param {object} oParam: Contains the below properties. The properties specified with ? are optional
		 * oParam.operation ? {string} - Request type (the default value is READ)
		 * oParam.oRequestData ? {object} - Data to hand over with the request
		 * oParam.success ? {function} - Callback function to execute if the service request is successful
		 * oParam.error ? {function} - Callback function to execute if the service request fails
		 * oParam.urlParameters ? {object} - Additional URL parameters to use in the request
		 * oParam.filters ? {object} - Array of filters to include in the request
		 * oParam.bSynchronous ? {boolean} - Boolean to specify whether the request must be synchronous (the default value is false)
		 * @return {object} ajax call
		 */
		callSapService: function (oServiceConfig, oParam) {
			oParam = oParam || {};
			// Se recupera el modelo donde se guardarán los datos de la configuración
			var sapUserModelOData = this.getModel(oServiceConfig.oDataModel);
			// se pone el contexto actual a una variable 
			var that = this;

			// Petición
			var oRequest;
			// Parámetros de la petición
			var oRequestParams = {
				// Función si va todo bien
				success: function (oResponse) {
					// Si hay respuesta y es erronea entonces se muestra un mensaje y se llama a la función de error
					// pasada en los parámetros
					if (oResponse && oResponse.EType === "E") {
						jQuery.sap.log.error("Error at service call: " + oServiceConfig.serviceName);
						if (oParam.error) {
							oParam.error.apply(this, arguments);
						}
					} else {
						// Si no hay error se llama a la función succes pasada por parámetro
						if (oParam.success) {
							oParam.success.apply(this, arguments);
						}
					}
				},
				// Función si se produce un error en la llamada
				error: function (oResponse) {
					/* GENERAL MESSAGE AT EVERY ERROR CALLBACK  */
					if (oResponse.statusCode === 500) {
						MessageToast.show("There was an error with SAP communication");
					} else {
						var oJsonResponse = oResponse && oResponse.responseText ? JSON.parse(oResponse.responseText) : undefined;

						if (oJsonResponse && oJsonResponse.error && oJsonResponse.error.message && oJsonResponse.error.message.value) {
							MessageToast.show(oJsonResponse.error.message.value);
						}
					}
					oParam.error.apply(this, arguments);
				},
				urlParameters: this.getUrlParameters(oParam.urlParameters),
				async: oParam.bSynchronous === true ? false : true
			};
			// Si el parámetro "mock" de la URL esta informado, o si no lo esta, a nivel de servicio si que se indica se leen los datos
			// del mock
			if (_bMock === true || (_bMock === undefined && oServiceConfig.bUseMock)) { // use mock data
				that.loadMockData(oServiceConfig, oParam);
			} else {
				// Use real backend ODATA CRUD functions

				switch (oParam.operation) {
					case "CREATE":
						oRequest = sapUserModelOData.create(
							oServiceConfig.serviceName,
							oParam.oRequestData,
							oRequestParams
						);
						break;
					case "UPDATE":
						sapUserModelOData.update(
							oServiceConfig.serviceName,
							oParam.oRequestData,
							oRequestParams
						);
						break;
					case "DELETE":
						oRequest = sapUserModelOData.remove(
							oServiceConfig.serviceName,
							//  oParam.oRequestData,
							oRequestParams
						);
						break;
					default: // "READ":
						if (oParam.filters) {
							oRequestParams.filters = oParam.filters;
						}
						oRequest = sapUserModelOData.read(
							oServiceConfig.serviceName,
							oRequestParams
						);
						break;

				}
			}
			return oRequest;
		},
		/* Obtención de los parámetros de la URL
		 */
		getUrlParameters: function (mUrlParameters) {
			return jQuery.sap.extend({}, mUrlParameters);
		},

		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_setConfiguration(mConf) {
			this._sLanguage = (mConf.language) ? mConf.language : "EN";

			// Se recupera los parametros de la URL. 
			// En los parametros habria uno que sera el MOCK que indica de donde se obtienen los valores: true todo vendra de los ficheros o mix que dependera
			// del atributo "bUseMock" del array de servicios en el fichero models.js.
			var oUrlParams = jQuery.sap.getUriParameters().mParams;

			this._bMock = (mConf.mock) ? mConf.mock : oUrlParams.mock && oUrlParams.mock[0];
			this._aoModel = (mConf.aoModels) ? mConf.aoModels : [];
			this._oMockDataModel = new JSONModel();
			this._MockbaseDir = (mConf.mockDataDir) ? mConf.mockDataDir : '';
		}
	});
});
