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
		readData:function(mParams){
			// Se recupera el objeto oData al que apunta el servicio
			var oModel = this.getModel(_mService.readData.oDataModel);

			// Se crea una nueva configuracuón donde se cambia el valor service name para pasarle la clave de la llama al servicio
			var mLocalService = merge({}, _mService.readData, {
				serviceName: oModel.createKey(_mService.readData.serviceName, {
					VIEWNAME: mParams.viewName,
					LANGU: this._sLanguage,
					MODE: mParams.mode
				})
			});

			return this.callOData(mLocalService);

		}

	});

});
