sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",	
	"sap/m/BusyDialog",
	"com/ivancio/zal30-ui5/state/ViewConfState",
	"com/ivancio/zal30-ui5/state/ViewDataState",
], function (UIComponent, Device, BusyDialog, ViewConfState, ViewDataState) {
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

			// Se inicializa la variable que controla si se esta mostrando el BusyDialog
			this._showBusyDialog = false;

		},
		// Muestra el indicador de procesando..
		showBusyDialog: function () {
			this._oBusyDialog.open();
			this._showBusyDialog = true; // Se guarda que se esta mostrando el dialogo de ocupado

		},
		// Devuelve si el 
		// Cierra el indicador de procesado
		closeBusyDialog: function () {
			this._oBusyDialog.close();
			this._showBusyDialog = false; // Se guarda que ya no se esta mostrando el dialogo de ocupado
		},
		// Devuelve si la ventana de ocupada se esta mostrando
		isBusyDialogOpen() {
			return this._showBusyDialog;
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

			// Se instancian la clase que gestiona los estados de la configuración de las vistas			
			this._oViewConfState = new ViewConfState(this);

			// Se instancia la clase que gestiona los estados de los datos de la vista
			this._oViewDataState = new ViewDataState(this);

			// A nivel interno de UI5 se fuerza el uso del ingles
			sap.ui.getCore().getConfiguration().setLanguage("en");

		}

	});
});
