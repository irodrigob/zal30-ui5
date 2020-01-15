sap.ui.define([
	"com/ivancio/zal30-ui5/controller/Base.controller",
	"sap/m/MessageToast",
	'sap/ui/model/Filter',
	'sap/ui/core/Fragment',
	"sap/base/Log",
	"com/ivancio/zal30-ui5/model/models",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/state/ViewConfState"
], function (BaseController, MessageToast, Filter, Fragment, Log, models, constants, ViewConfState) {
	"use strict";

	var _inputViewID = ''; // Guarda el ID del control input para introducir la vista  

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
			this._initModel();

			// Se asocia el método que se ejecutará cada vez que se navegue a este método por el routing
			this._oOwnerComponent.getRouter().getRoute(this._mSections.viewSelect).attachPatternMatched(this._onRouteMatched, this);

			// Inicialización del modelo de datos
			this._initModelData();
		},

		// Método que gestiona la ayuda para bC:squeda de las vistas
		onHandleViewHelp: function (oEvent) {
			// Se recupera el valor actual para aplicar al filtro de la ventana de vistas
			var sInputValue = oEvent.getSource().getValue();

			// Se guarda en una variable global el ID del input de vistas. Este servirC! para posteriormente
			// saber donde guardar el valor
			this._inputViewID = oEvent.getSource().getId();

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

			// Se recupera la vista seleccionada
			var viewName = this._oViewSelectModel.getProperty("/viewName");

			var oViewInput = this.byId("viewInput"); // Objeto input donde se introduce la vista

			// Se valida que la vista introducida sea valida
			if (this._checkValidViewName(viewName)) {

				// Se valida que se tenga autorización. Si la tiene se irá a ver los datos, en caso contrario se volverá al
				// proceso
				this._checkAuthView(viewName);

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

			// Se recupera el objeto input de la vista para poder cambiar su estado
			var oViewInput = this.byId(oEvent.getSource().getId());

			// Si no hay vista se marca en el modelo que no hay vista y se indica que el campo es erróneo  
			if (oEvent.getParameter("value") === "") {
				this._oViewSelectModel.setProperty("/viewSelected", false);
				oViewInput.setValueState(sap.ui.core.ValueState.Error);
				oViewInput.setValueStateText(this._oI18nResource.getText("ViewSelect.viewMandatory"));
				MessageToast.show(this._oI18nResource.getText("ViewSelect.viewMandatory"));
			} else {
				// Si hay vista(que no significa que sea valida) se indica que se ha seleccionado y se quita
				// que el campo es erróneo
				this._oViewSelectModel.setProperty("/viewSelected", true);
				oViewInput.setValueState(sap.ui.core.ValueState.None);

			}
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		// Modelo interno de la vista
		_initModel: function () {
			this._oViewSelectModel = new sap.ui.model.json.JSONModel();
			this._resetModel(); // Reset del modelo de datos

			this.getView().setModel(this._oViewSelectModel, "ViewSelectModel");
		},
		// Validación que la vista exista
		_checkValidViewName: function (sViewName) {
			// Los datos de las vistas válidas se han recuperado previamente para poder hacer las sugerencias y ayudas
			// para búsqueda. Por lo tanto la validación es tan simple como validar que exista la vista pasada por parámetro en el array

			// Si no existe el método devuelve un "undefined"            
			if (this.getViewInfo(sViewName))
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
				var oViewInput = this.byId(this._inputViewID);

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

			// Se tiene que hacer el control de autorización de la vista
			this._oAppDataModel.setProperty("/checkAuthView", true);

			// Si la sección anterior y la actual difiere hay que resetear el modelo
			if (sPreviousSection !== this._mSections.viewSelect) {
				this._resetModel();
			}
		},
		// Reset del modelo de datos
		_resetModel: function () {
			this._oViewSelectModel.setData({
				viewSelected: false,
				viewName: ''
			});
		},
		// Control de autorización en la vista
		_checkAuthView: function (sViewName) {

			// Se muestra que el proceso esta ocupado
			this._oOwnerComponent.showBusyDialog();
			var that = this; // Se pasa el contexto a otra variable para poder acceder al contexto actual en las siguiente llamadas

			this.checkAuthView(sViewName, {
				success: function (oAuth) {
					that._oOwnerComponent.closeBusyDialog();
					var oViewInput = that.byId("viewInput");

					if (oAuth.LEVELAUTH == constants.mLevelAuth.non) {
						oViewInput.setValueState(sap.ui.core.ValueState.Error);
						oViewInput.setValueStateText(that._oI18nResource.getText("ViewSelect.viewNotAuth"));
						MessageToast.show(that._oI18nResource.getText("ViewSelect.viewNotAuth"));

					} else {
						oViewInput.setValueState(sap.ui.core.ValueState.None); // Se quita el posible estado que tenga

						// No se tiene que hacer el control de autorización porque ya se ha hecho	


						// Se navega hacía la página con la vista
						that.navRoute(that._mSections.viewData, {
							view: sViewName
						});
					}
				},
				error: function () {
					that._oOwnerComponent.closeBusyDialog();
				}
			});

		},
		// Inicialización del modelo de datos y carga inicial de datos
		_initModelData: function () {
			// Se indica que se accede por la vista de selección de vistas
			this._oAppDataModel.setProperty("/viewSelect", true);

			// Se recupera la clase que gestiona los estado de la configuración de las vistas
			debugger;
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);
		}

	});
});
