sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (CoreService, merge, Filter, constants) {
	"use strict";

	var _mService = {
		readData: {
			serviceName: "/readDataSet",
			bUseMock: false,
			mockFile: "/readData.json",
			oDataModel: "masterData"
		},
		lockView: {
			serviceName: "/lockViewSet",
			bUseMock: false,
			mockFile: "/lockView.json",
			oDataModel: "masterData"
		},
		rowValidationDetermination: {
			serviceName: "/rowValidationDeterminationSet",
			bUseMock: false,
			mockFile: "/rowValidationDetermination.json",
			oDataModel: "masterData"
		},
		verifyFieldData: {
			serviceName: "/verifyFieldDataSet",
			bUseMock: false,
			mockFile: "/verifyFieldData.json",
			oDataModel: "masterData"
		}
	};

	return CoreService.extend("com.ivancio.zal30-ui5.service.ViewDataService", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent) {

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent);

			// Se informan los modelos oData donde se obtendrán los datos	
			this.setModelOdata([{
				name: "masterData",
				model: this._oOwnerComponent.getModel("masterData")
			}]);

			// Se informa el directorio donde están los datos del mock
			this.setMockBaseDir("com.ivancio.zal30-ui5.localService");
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////		
		// Lectura de los datos
		readData: function (mParams) {
			// Se recupera el objeto oData al que apunta el servicio
			var oModel = this.getModel(_mService.readData.oDataModel);

			// Se crea una nueva configuración donde se cambia el valor service name para pasarle la clave de la llama al servicio
			if (this._bMock) {
				var mLocalService = merge({}, _mService.readData, {});
			} else {
				var mLocalService = merge({}, _mService.readData, {
					serviceName: oModel.createKey(_mService.readData.serviceName, {
						VIEWNAME: mParams.viewName,
						LANGU: this._sLanguage,
						MODE: mParams.editMode
					})
				});
			}


			return this.callOData(mLocalService).get();

		},
		// Bloqueo de los datos de la vista
		lockView: function (mParams) {
			// Se recupera el objeto oData al que apunta el servicio
			var oModel = this.getModel(_mService.lockView.oDataModel);

			if (this._bMock) {
				// Se crea una nueva configuracuón donde se cambia el valor service name para pasarle la clave de la llama al servicio
				var mLocalService = merge({}, _mService.lockView, {});

			} else {
				// Se crea una nueva configuracuón donde se cambia el valor service name para pasarle la clave de la llama al servicio
				var mLocalService = merge({}, _mService.lockView, {
					serviceName: oModel.createKey(_mService.lockView.serviceName, {
						VIEWNAME: mParams.viewName
					})
				});

			}

			return this.callOData(mLocalService).get();

		},
		// Validación y determinación de valores de una fila
		rowValidateDetermination: function (sViewName, mRow) {
			return this.callOData(_mService.rowValidationDetermination).post({
				VIEWNAME: sViewName,
				LANGU: this._sLanguage,				
				ROW: JSON.stringify(mRow)
			}, {});
		},
		// Verificación del valor a nivel de campos
		verifyFieldData: function (sViewName, sValue, sColumn) {
			// Se recupera el objeto oData al que apunta el servicio
			var oModel = this.getModel(_mService.lockView.oDataModel);

			if (this._bMock) {
				// Se crea una nueva configuracuón donde se cambia el valor service name para pasarle la clave de la llama al servicio
				var mLocalService = merge({}, _mService.verifyFieldData, {});

			} else {
				// Se crea una nueva configuracuón donde se cambia el valor service name para pasarle la clave de la llama al servicio
				var mLocalService = merge({}, _mService.verifyFieldData, {
					serviceName: oModel.createKey(_mService.verifyFieldData.serviceName, {
						VIEWNAME: sViewName,
						COLUMN: sColumn,
						VALUE: sValue,
						LANGU: this._sLanguage
					})
				});

			}

			return this.callOData(mLocalService).get();
		}

	});

});
