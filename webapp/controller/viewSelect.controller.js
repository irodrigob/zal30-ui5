sap.ui.define([
	"com/ivancio/zal30-ui5/controller/Base.controller",
	"sap/m/MessageToast",
	'sap/ui/model/Filter',
	'sap/ui/core/Fragment',
	"sap/base/Log",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/state/ViewConfState"
], function (BaseController, MessageToast, Filter, Fragment, Log, constants, ViewConfState) {
	"use strict";


	return BaseController.extend("com.ivancio.zal30-ui5.controller.ViewSelect", {

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		onInit: function () {
			this._oOwnerComponent = this.getOwnerComponent();
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");
			this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();

			// Inicialización del modelo de datos
			this._initModelData();

			// Se asocia el método que se ejecutará cada vez que se navegue a este método por el routing
			this._oOwnerComponent.getRouter().getRoute(this._mSections.viewSelect).attachPatternMatched(this._onRouteMatched, this);



		},
		// Método que gestiona la ayuda para busqueda de las vistas
		onHandleViewHelp: function (oEvent) {
			// Se recupera el valor actual para aplicar al filtro de la ventana de vistas
			var sInputValue = oEvent.getSource().getValue();

			// se crea la ayuda para bC:squeda si no esta creada previamente
			if (!this._valueHelpDialog) {
				// Se inicializa una variable local con el fragmento creado
				this._valueHelpDialog = sap.ui.xmlfragment(
					"com.ivancio.zal30-ui5.fragment.valueHelpView", // Nombre del fragment
					this // Controlador
				);
				// Se asocia el fragmento a la vista para que pueda usar modelo, controlador, etc..
				this.getView().addDependent(this._valueHelpDialog);
			}

			// Se abre el dialogo 
			this._valueHelpDialog.open();
		},
		// Navega a la vista introducida
		onGoViewData: function (oEvent) {
			var that = this;

			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// Se recupera la vista seleccionada
			var viewName = oViewConfModel.getProperty("/viewName");


			var oViewInput = this.byId("viewInput"); // Objeto input donde se introduce la vista

			// Se valida que la vista introducida sea valida
			if (this._checkValidViewName(viewName)) {

				oViewInput.setValueState(sap.ui.core.ValueState.None); // Se quita el posible estado que tenga

				// Se navega hacía la página con la vista
				that.navRoute(that._mSections.viewData, {
					view: viewName
				});
			} else {

				oViewInput.setValueState(sap.ui.core.ValueState.Error);
				oViewInput.setValueStateText(this._oI18nResource.getText("ViewSelect.viewNotValid"));
				MessageToast.show(this._oI18nResource.getText("ViewSelect.viewNotValid"));
			}


		},
		// Vista seleccionada según la sugerencia de valorees
		suggestionViewSelected: function (oEvent) {
			var oItem = oEvent.getParameter('selectedItem');

			// en la descripción del campo de entrada se guarda la descripción
			var oViewInput = this.byId(oEvent.getSource().getId());
			oViewInput.setDescription(oItem ? oItem.getText() : '');

		},

		// Método que entra cuando el input de la vista cambia. Se usará para verificar que exis
		onChangeView: function (oEvent) {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// Se recupera el objeto input de la vista para poder cambiar su estado
			var oViewInput = this.byId(oEvent.getSource().getId());

			// Si no hay vista se marca en el modelo que no hay vista y se indica que el campo es erróneo  
			if (oEvent.getParameter("value") === "") {
				oViewConfModel.setProperty("/btnGoView", false);
				oViewInput.setValueState(sap.ui.core.ValueState.Error);
				oViewInput.setValueStateText(this._oI18nResource.getText("ViewSelect.viewMandatory"));
				MessageToast.show(this._oI18nResource.getText("ViewSelect.viewMandatory"));
			} else {
				// Si hay vista(que no significa que sea valida) se indica que se ha seleccionado y se quita
				// que el campo es erróneo
				oViewConfModel.setProperty("/btnGoView", true);
				oViewInput.setValueState(sap.ui.core.ValueState.None);
				//this._oViewSelectModel.setProperty("/viewName", oEvent.getParameter("value"))

			}
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////

		// Validación que la vista exista
		_checkValidViewName: function (sViewName) {
			// Los datos de las vistas válidas se han recuperado previamente para poder hacer las sugerencias y ayudas
			// para búsqueda. Por lo tanto la validación es tan simple como validar que exista la vista pasada por parámetro en el array

			// Si no existe el método devuelve un "undefined"            
			if (this._viewConfState.getViewInfo(sViewName))
				return true;
			else
				return false;
		},
		// Método que permite filtrar un valor en la ayuda para búsqueda
		_handleViewHelpSearch: function (oEvent) {
			// Se recupera el valor introducido en la ayuda para búsqueda
			var sValue = oEvent.getParameter("value");
			// Se crea un filtro con el valor introducido
			var oFilter = new Filter("VIEWDESC", sap.ui.model.FilterOperator.Contains, sValue);
			// Se aplica el filtro
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		_handleViewHelpClose: function (oEvent) {
			// Se recupera el posible objeto seleccionado
			var oSelectedItem = oEvent.getParameter("selectedItem");
			// Si realmente hay algo seleccionado
			if (oSelectedItem) {
				// Se recupera el objeto input en base al ID guardado al inicio
				var oViewInput = this.byId(constants.objectsId.viewSelect.viewInput);

				// En el título se ha puesto el nombre técnico de la vista, que se aprovecha para guardarlo en la variable         
				oViewInput.setSelectedKey(oSelectedItem.getTitle());
				// En la descripción se guarda la descripción
				oViewInput.setDescription(oSelectedItem.getDescription());
			}
			// se elimina los filtros
			oEvent.getSource().getBinding("items").filter([]);
		},
		// Método que entra cuando se hace a la página desde la routing
		_onRouteMatched: function (oEvent) {

			// Se recupera el valor anterior de la sección donde se esta  
			var sPreviousSection = this._oAppDataModel.getProperty("/section");

			// Guardo la sección actual
			this._oAppDataModel.setProperty("/section", this._mSections.viewSelect);

			// Se indica que se accede por la vista de selección de vistas
			this._oAppDataModel.setProperty("/viewSelect", true);

			// Si la sección anterior y la actual difiere hay que resetear el modelo
			if (sPreviousSection !== this._mSections.viewSelect) {
				this._resetModel();
			}
		},
		// Reset del modelo de datos
		_resetModel: function () {
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			oViewConfModel.setProperty("/btnGoView", false);
			oViewConfModel.setProperty("/viewName", '');

		},
		// Inicialización del modelo de datos y carga inicial de datos
		_initModelData: function () {

			this._resetModel(); // Reset del modelo de datos

			// Se recupera la clase que gestiona los estado de la configuración de las vistas			
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);

			// Lectura de las vistas que se pueden seleccionar
			this._getViewList();

		},
		// Lectura de las vistas que se pueden seleccionar
		_getViewList: function () {
			var that = this;
			var oViewConfModel = this._oOwnerComponent.getModel(constants.jsonModel.viewConf);

			// Se pone el loader en el campo antes de hacer la lectura de las vistas						
			var oViewInput = this.byId(constants.objectsId.viewSelect.viewInput);
			oViewInput.setBusy(true);

			this._viewConfState.getViewList(null,
				function (mList) {					
					oViewInput.setBusy(false); // Se quita el indicador de ocupado
				},
				function (mError) {
					oViewInput.setBusy(false); // Se quita el indicador de ocupado					
					MessageToast.show(that._oI18nResource.getText("CoreService.generalError", [mError.statusCode + ' ' + mError.statusText]));

				}
			);

		},

	});
});
