sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/ivancio/zal30-ui5/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.ivancio.zal30-ui5.Component", {

		metadata: {
			manifest: "json"
		},

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

		},
		_initModelData: function () {
			// Se inicializa la variable con el modelo de la aplicación. Este AppData esta
			// definido en el manifest con la etiqueta "appData". 
			var oAppDataModel = this.getModel("appData");

			oAppDataModel.setProperty("/section", '');


			// Se recupera los parámetros de la URL. 
			// En los parámetros habrá uno que será el MOCK que indica de donde se obtienen los valores: true todo vendrá de los ficheros o mix que dependerá
			// del atributo "bUseMock" del array de servicios en el fichero models.js.
			var oUrlParams = jQuery.sap.getUriParameters().mParams;

			// Se indica la configuración de donde se recuperarán los datos en SAP.
			// El primer parámetro es el modelo donde se obtendrán los datos que contendrá dos campos:
			// 1) Nombre /npm stardonde esta definido los datos en el manifest para recuperarlos. 2) Modelo de datos donde se guardará
			// El segundo parámetro es el idioma
			// El tercer parámetro es si los datos se recuperarán del mock de dos maneras: siempre del mock o dependiendo si el servicio ya esta implementado
			//debugger;
			models.setConfig([{
				name: "masterData",
				model: this.getModel("masterData")
			}
			], "EN", oUrlParams.mock && oUrlParams.mock[0]);

			// Directorio donde estarán los archivos mock
			models.setBaseDir("com.ivancio.zal30-ui5.model.mock");

			// A nivel interno de UI5 se fuerza el uso del ingles
			sap.ui.getCore().getConfiguration().setLanguage("en");

			// Carga de las vistas para poder ser seleccionadas
			this._getViews();
		},
		_getViews: function () {
			var oAppDataModel = this.getModel("appData");

			// El contexto actual se pasa a una variable para que no se pierda en las llamadas que se harán al modelo
			var that = this;

			// El modelo tiene tres parámetros: parámetros del servicio, funcion cuando el servicio va bien, función cuando el servicio no va bien
			models.getViews(null,
				function (oViews) {					
					// El nodo result que siempre devuelve el Gateway no lo queremos en este caso					
					oAppDataModel.setProperty("/views", oViews.results);
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {

				});

		},
		// Proceso para la obtención de los datos de la vista
		_getViewData:function(){
			
		}
	});
});
