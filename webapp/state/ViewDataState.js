sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewDataService",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/model/View"
], function (ViewBaseState, ViewDataService, constants, View) {
	"use strict";

	var oViewDataState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usaran el modelo
			this._initServices();

			// Se recupera la clase que gestiona los estados de la configuración de la vista
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);

		},
		// Lectura de la configuración y datos
		readConfDataView(mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Servicio de leer la configuración de la tabla.	

			// Servicio de leer los datos de la tabla			
			/*var oSrvReadConf = this.readDataView({
				viewName: mParams.viewName
			});*/

			Promise.all([this._viewConfState.readView({
				viewName: mParams.viewName,
				fromViewData: true
			}), this.readDataView({
				viewName: mParams.viewName
			})]).then((result) => {

					// En el registro 0 esta el resultado de la primera llamada
					that._oView = result[0];

					// En el registro 1 esta los datos
					that._oView.setViewDataFromService(result[1].DATA);

					// Se ejecuta el código del Success
					oSuccessHandler();

				},
				(error) => {
					oErrorHandler(error);

				});

		},
		// lectura de los datos de la vista
		readDataView: function (mParams) {
			return this._oViewDataService.readData({
				viewName: mParams.viewName,
				mode: constants.editMode.view
			});
		},
		// Se devuelve los datos de cabecera de la vista
		getViewInfo: function () {
			return {
				viewName: this._oView.viewInfo.viewName,
				viewDesc: this._oView.viewInfo.viewDesc
			};
		},
		// Se devuelve las columnas de la tabla a partir del catalogo de campos
		getColumnsTable: function () {
			var fieldCatalog = this._oView.getFieldCatalog();

			var aColumns = [];
			for (var x = 0; x < fieldCatalog.length; x++) {
				var mColumn = {
					name: fieldCatalog[x].FIELDNAME,
					shortText: fieldCatalog[x].SHORTEXT,
					mediumText: fieldCatalog[x].MEDIUMTEXT,
					longText: fieldCatalog[x].LONGTEXT,
					headerText: fieldCatalog[x].HEADERTEXT
				};
				aColumns.push(mColumn);
			};
			return (aColumns);
		},
		// Devuelve los datos de la vista
		getViewData() {
			return this._oView.getViewData();
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewDataService = new ViewDataService(this._oOwnerComponent);

		},
	});
	return oViewDataState;
});
