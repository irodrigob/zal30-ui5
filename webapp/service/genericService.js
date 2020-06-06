sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (CoreService, merge, Filter, constants) {
	//////////////////////////////////
	//                              //
	//        List of services      //
	//                              //
	//////////////////////////////////
	var _mService = {
		getUserConf: {
			serviceName: "/getUserConfSet",
			bUseMock: false,
			mockFile: "/getUserConf.json",
			oDataModel: constants.oDataModel.masterData
		}
	};

	return CoreService.extend("com.ivancio.zal30-ui5.service.ViewConfService", {
		constructor: function (oComponent) {

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent);

			// Se informan los modelos oData donde se obtendrán los datos	
			this.setModelOdata([{
				name: constants.oDataModel.masterData,
				model: this._oOwnerComponent.getModel(constants.oDataModel.masterData)
			}]);

			// Se informa el directorio donde están los datos del mock
			this.setMockBaseDir("com.ivancio.zal30-ui5.localService");
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////	
		// Obtención de la configuración del usuarios
		getUserConfiguration: function () {
			var oModel = this.getModel(_mService.getUserConf.oDataModel);

			var mLocalService = merge({}, _mService.getUserConf, {
				serviceName: oModel.createKey(_mService.getUserConf.serviceName, {
					USERNAME: ""
				})
			});

			return this.callOData(mLocalService).get();
		}
	});
});
