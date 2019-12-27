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
			
			// Se recupera los parámetros de la URL
			var oUrlParams = jQuery.sap.getUriParameters().mParams;
			
			// Se indica la configuración de donde se recuperarán los datos en SAP.
			// El primer parámetro es el modelo donde se obtendrán los datos que contendrá dos campos:
			// 1) Nombre donde esta definido los datos en el manifest para recuperarlos. 2) Modelo de datos donde se guardará
			// El segundo parámetro es el idioma
			// El tercer parámetro es si los datos se recuperarán del mock de dos maneras: siempre del mock o dependiendo si el servicio ya esta implementado
			ModelHandler.setConfig([{
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
			oAppDataModel = this.getModel("appData");

		}
	});
});
