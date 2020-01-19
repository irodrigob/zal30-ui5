sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/ivancio/zal30-ui5/model/models",
	"sap/m/BusyDialog",
	"com/ivancio/zal30-ui5/service/ViewConfService",
	"com/ivancio/zal30-ui5/state/ViewConfState",
], function (UIComponent, Device, models, BusyDialog, ViewConfService, ViewConfState) {
	"use strict";

	return UIComponent.extend("com.ivancio.zal30-ui5.Component", {

		metadata: {
			manifest: "json"
		},
		state: {
			confView: "ViewConf",
			dataView: "ViewData"
		},
		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// Se inicializa el modelo de datos
			this._initModelData();

			// Se instancia la ventana de proceso ocupado
			this._oBusyDialog = new BusyDialog();

		},
		// Muestra el indicador de procesando..
		showBusyDialog: function () {
			this._oBusyDialog.open();

		},
		// Cierra el indicador de procesado
		closeBusyDialog: function () {
			this._oBusyDialog.close();
		},
		// Devuelve la variable con el servicio
		getState: function (sState) {
			return this["_o" + sState + "State"];
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		_initModelData: function () {

			// Se inicializa la variable con el modelo de la aplicaciC3n. Este AppData esta
			// definido en el manifest con la etiqueta "appData". 
			var oAppDataModel = this.getModel("appData");

			oAppDataModel.setProperty("/section", ''); // En que pC!gina o seccion de la aplicaciC3n se esta

			// Se indica que se tiene que hacer el control de autorizaciC3n de la vista
			oAppDataModel.setProperty("/checkAuthView", true);

			// Se indica que NO se accede por la vista de seleccion de vistas. Esto cambiara al acceder
			// a la pagina de seleccion de vistas
			oAppDataModel.setProperty("/viewSelect", false);

			// Se instancian las clase que gestiona los distintos estados de las vistas			
			this._oViewConfState = new ViewConfState(this);
			// A nivel interno de UI5 se fuerza el uso del ingles
			sap.ui.getCore().getConfiguration().setLanguage("en");

		},
		_getViews: function () {
			var oAppDataModel = this.getModel("appData");

			// El contexto actual se pasa a una variable para que no se pierda en las llamadas que se harC!n al modelo
			var that = this;

			debugger;
			// El modelo tiene tres parC!metros: parC!metros del servicio, funcion cuando el servicio va bien, funciC3n cuando el servicio no va bien
			models.getViews(null,
				function (oViews) {
					// El nodo result que siempre devuelve el Gateway no lo queremos en este caso					
					oAppDataModel.setProperty("/views", oViews.results);
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {

				});

		},
		// Proceso para la obtenciC3n de los datos de la vista
		_getViewData: function () {

		}
	});
});
