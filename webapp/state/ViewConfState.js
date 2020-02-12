sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewConfService",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/model/View"
], function (ViewBaseState, ViewConfService, constants, View) {
	"use strict";


	var oViewConfState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usaran el modelo
			this._initServices();

		},
		// Obtiene la lista de vistas 
		getViewList: function (oParams, oSuccessHandler, oErrorHandler) {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// El modelo tiene tres parametros: parC!metros del servicio, funcion cuando el servicio va bien, funcion cuando el servicio no va bien
			this._oViewConfService.getViews(oParams,
				function (oViews) {
					// El nodo result que siempre devuelve el Gateway no lo queremos en este caso							
					oViewConfModel.setProperty("/viewList", oViews.results);

					// Si se le pasado parámetros para el success se ejecuta
					if (oSuccessHandler) {
						oSuccessHandler(oViews.results);
					}
				},
				// funcion sin nombre se llama a si misma sin necesidad de hacerlo manualmente
				function () {
					// Si se le pasado parámetros para el error se ejecuta
					if (oErrorHandler) {
						oErrorHandler();
					}
				});

		},
		// Verifica si una vista esta en el listado de vistas
		getViewInfo: function (sViewName) {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// Se recuperan las vista que estC!n en el modelo de datos
			var aViews = oViewConfModel.getProperty("/viewList");

			// Si no existe el find devuelve un "undefined"
			return aViews.find(view => view.VIEWNAME === sViewName)

		},
		// lectura de de la vista: configuración y datos
		readView: function (mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Si el origen de la llama es desde la consulta de los datos, la llama se hará en modo promise porque hay que encadenar
			// llamadas. En caso contrario se llama sin esa funcionalidad
			if (mParams.fromViewData) {
				var oPromise = new Promise(function (resolve, reject) {

					// Se lee la configuración de la vista			
					that._oViewConfService.readView({
						viewName: mParams.viewName,
						mode: mParams.editMode
					}).then((result) => {

							// Se llama al método que devuelve el objeto View con la información del catalogo + la general 
							var oView = that._instanceViewObject({
								viewName: mParams.viewName,
								fieldCatalog: result.results
							});

							resolve(oView);
						},
						(error) => {
							reject(error);

						});
				});
				return oPromise;
			} else {
				this._oViewConfService.readView({
					viewName: mParams.viewName,
					mode: mParams.editMode
				}).then((result) => {
						// Se llama al método que devuelve el objeto View con la información del catalogo + la general 
						var oView = that._instanceViewObject({
							viewName: mParams.viewName,
							fieldCatalog: result.results
						});


					},
					(error) => {


					});
			}

		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewConfService = new ViewConfService(this._oOwnerComponent);

		},
		// Se instacia el objeto vista con los datos pasados + otros que se determinan
		_instanceViewObject(mParams) {
			// Se instancia el objeto vista que guardará toda la información de la vista pasada por parámetro			
			var oView = new View(this._oOwnerComponent);

			// Se guarda la info general de la vista
			oView.setViewInfo(this.getViewInfo(mParams.viewName));

			// Se guarda el catalogo de campos
			oView.setFieldCatalogFromService(this._convertServiceFieldCatalog2Intern(mParams.fieldCatalog));

			return oView;

		},
		// Se convierte el catalogo del servicio en el formato propio de la aplicación
		_convertServiceFieldCatalog2Intern: function (mFieldCatalog) {

			var aColumns = [];
			for (var x = 0; x < mFieldCatalog.length; x++) {
				var mColumn = {
					name: fieldCatalog[x].FIELDNAME,
					shortText: fieldCatalog[x].SHORTEXT,
					mediumText: fieldCatalog[x].MEDIUMTEXT,
					longText: fieldCatalog[x].LONGTEXT,
					headerText: fieldCatalog[x].HEADERTEXT,
					mandatory: fieldCatalog[x].MANDATORY,
					noOutput: fieldCatalog[x].NOOUTPUT,
					checkBox:fieldCatalog[x].CHECKBOX,
					keyDDIC:fieldCatalog[x].KEYDDIC,
					edit:fieldCatalog[x].EDIT,
					type:fieldCatalog[x].TYPE,
					len:fieldCatalog[x].LEN,
					decimals:fieldCatalog[x].DECIMALS,
					lowerCase:fieldCatalog[x].LOWERCASE
				};
				aColumns.push(mColumn);
			};
			return (aColumns);

		}
	});
	return oViewConfState;
});
