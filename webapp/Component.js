sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/m/BusyDialog",
	"com/ivancio/zal30-ui5/state/ViewConfState",
	"com/ivancio/zal30-ui5/state/ViewDataState",
	"sap/ui/core/format/NumberFormat",
	"com/ivancio/zal30-ui5/service/genericService",
], function (UIComponent, Device, BusyDialog, ViewConfState, ViewDataState, NumberFormat, genericService) {
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

			// Lectura de la configuración inicial del usuario
			this._getUserConfiguration();

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
		// Devuelve la configuración del usuario
		getUserConfig: function () {
			return this._oUserConfig;
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		// Inicializa el modelo interno de datos
		_initModelData: function () {

			// Se inicializa la variable con el modelo de la aplicacion. Este AppData esta
			// definido en el manifest con la etiqueta "appData". 
			var oAppDataModel = this.getModel("appData");

			oAppDataModel.setProperty("/section", ''); // En que pagina o seccion de la aplicaciC3n se esta

			// Se indica que se tiene que hacer el control de autorizacion de la vista
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

			// Se instancia el servicio general de datos pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oGenericService = new genericService(this);

		},
		_getUserConfiguration: function () {
			var that = this;

			// Si establece una configuración por defecto que será modificada según el resultado del servicio
			this._initUserConfiguration();

			this._oGenericService.getUserConfiguration().then((result) => {

			}, (error) => {

			})
		},
		// Inicializacion de la configuración del usuario
		_initUserConfiguration: function () {
			this._oUserConfig = {
				timeFormat: "HHmmss",
				displayTimeFormat: "HH:mm:ss",
				dateFormat: "yyyyMMdd", //sap.ui.core.format.DateFormat.getInstance().oFormatOptions.pattern,
				displayDateFormat: "dd/MM/yyyy",
				decimalSeparator: sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator,
				thousandSeparator: sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator === "." ? "," : "."
			};
		}


	});
});
