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
			dataView:"ViewData"
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

			// Se inicializa los servicios
			//this._initServices();

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

			// Se indica que NO se accede por la vista de selecciC3n de vistas. Esto cambiara al acceder
			// a la pagina de seleccion de vistas
			oAppDataModel.setProperty("/viewSelect", false);

			// Se instancian las clase que gestiona los distintos estados de las vistas			
			this._oViewConfState = new ViewConfState(this);

			// Se indica la configuraciC3n de donde se recuperarC!n los datos en SAP.
			// El primer parC!metro es el modelo donde se obtendrC!n los datos que contendrC! dos campos:
			// 1) Nombre /npm stardonde esta definido los datos en el manifest para recuperarlos. 2) Modelo de datos donde se guardarC!
			// El segundo parC!metro es el idioma
			// El tercer parC!metro es si los datos se recuperarC!n del mock de dos maneras: siempre del mock o dependiendo si el servicio ya esta implementado

			/*models.setConfig([{
				name: "masterData",
				model: this.getModel("masterData")
			}], "EN", oUrlParams.mock && oUrlParams.mock[0]);*/

			// Directorio donde estarC!n los archivos mock
			//models.setBaseDir("com.ivancio.zal30-ui5.model.mock");

			// A nivel interno de UI5 se fuerza el uso del ingles
			sap.ui.getCore().getConfiguration().setLanguage("en");

			// Carga de las vistas para poder ser seleccionadas
			//this._getViews();
		},
		// InicializaciC3n de los servicios de la aplicaciC3n
		_initServices: function () {
			// Se recupera los parametros de la URL. 
			// En los parametros habria uno que sera el MOCK que indica de donde se obtienen los valores: true todo vendra de los ficheros o mix que dependera
			// del atributo "bUseMock" del array de servicios en el fichero models.js.
			var oUrlParams = jQuery.sap.getUriParameters().mParams;

			// Se instancia el servicio de configuraciC3n de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicaciC3n definido en el manifest y los parC!metros generales de como ha de funcionar los servicios.
			//
			this._oViewConfService = new ViewConfService(this, {
				language: "EN",				
				mockDataDir: "com.ivancio.zal30-ui5.localService"
			});

		},
		_getViews: function () {
			var oAppDataModel = this.getModel("appData");

			// El contexto actual se pasa a una variable para que no se pierda en las llamadas que se harC!n al modelo
			var that = this;

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
