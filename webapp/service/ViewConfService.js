sap.ui.define([
	"com/ivancio/zal30-ui5/service/CoreService",
	"sap/base/util/merge"
], function (
	CoreService, merge
) {
	"use strict";

	//////////////////////////////////
	//                              //
	//        List of services      //
	//                              //
	//////////////////////////////////
	var _mService = {
		getViews: {
			serviceName: "/getViewsSet",
			bUseMock: true,
			mockFile: "/getViews.json",
			oDataModel: "masterData"
		},
		checkAuthView: {
			serviceName: "/checkAuthViewSet",
			bUseMock: false,
			mockFile: "/checkAuthView.json",
			oDataModel: "masterData"
		}
	};


	var oViewConfService = CoreService.extend("com.ivancio.zal30-ui5.service.ViewConfService", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent, mConf) {

			// Se llama el core de los servicios pasandole los parámetros recibidos
			CoreService.call(this, oComponent, mConf);
			
			// Se añade la configuración propia para acceder a los servicios
			this._addOwnConfig();
		},
		//////////////////////////////////	
		//        Services              //	
		//////////////////////////////////		  
		getViews: function (oParameters, successHandler, errorHandler) {

			// Variable local que indica si el Gateway esta disponible
			var bgwAvailable = false;
			// Guardo el contexto actual en una variable local
			var that = this;
			// Se recupera el modelo donde se guardarC! la informaciC3n
			var oModel = this.getModel(_mService.getViews.oDataModel);

			// Cuando se llama a un servicio en el gateway lo habitual es lanzar el $metadata del servicio para que se refresque
			// internamente el modelo de datos. Con el "attachMetadataLoaded" lo que se hace es aC1adir una funciC3n para que cuando se termine de cargar
			// el metadatos se ejecute el cC3digo pasado. De esta manera queda garantizado la carga del metadata antes de llamar al servicio.
			// Este servicio se usan dos parC!metros: el primer es la funciC3n que se ejecuta cuando se produzca el evento, en este caso, es
			// llamar al sericio. El segundo es el "listener" que en este caso se pasa el propio contexto
			oModel.attachMetadataLoaded(function () {

					// Si entra aquC- es que hay gateway por lo tanto cambio a true la variable local desde donde se llama
					bgwAvailable = true;

					// Se llama al servicio para obtener los datos de Gateway o del mock				
					this.callSapService(_mService.getViews, {
						filters: [new Filter("LANGU", sap.ui.model.FilterOperator.EQ, _sLanguage)],
						success: function (oData) {
							if (successHandler) {
								if (oData) {
									successHandler(oData);
								} else {
									if (errorHandler) {
										errorHandler();
									}
								}
							}
						},
						error: errorHandler
					});
				},
				this);

			/*
				// Se llama al servicio para obtener los datos del mock si no hay Gateway
			if (!bgwAvailable) {
				_bMock = true; // Sin gateway todo tiene que por mock
				this.callSapService(_mService.getViews, {
					success: function (oData) {
						if (successHandler) {
							if (oData) {
								successHandler(oData);
							} else {
								if (errorHandler) {
									errorHandler();
								}
							}
						}
					},
					error: errorHandler
				});
			} */

		},
		// Obtiene la autorizaciC3n para la vista
		checkAuthView: function (oParameters, successHandler, errorHandler) {
			// Se recupera el modelo donde se guardarC! la informaciC3n
			var oModel = this.getModel(_mService.checkAuthView.oDataModel);

			var mLocalService = merge({}, _mService.checkAuthView, {
				serviceName: oModel.createKey(_mService.checkAuthView.serviceName, {
					VIEWNAME: oParameters.viewname
				})
			});

			// Se llama al servicio  	
			this.callSapService(mLocalService, {
				bSynchronous: true, // Tiene que ser sincrono para saber la respuesta inmediata
				success: function (oData) {
					if (successHandler) {
						if (oData) {
							successHandler(oData);
						} else {
							if (errorHandler) {
								errorHandler();
							}
						}
					}
				},
				error: errorHandler
			});

		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_addOwnConfig: function (mConf) {

			this.setConfig({
				aoModels: [{
					name: "masterData",
					model: this._oOwnerComponent.getModel("masterData")
				}]
			});
		}

	});
	return oViewConfService;
});
