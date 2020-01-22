sap.ui.define([
	"com/ivancio/zal30-ui5/controller/Base.controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/component/general/LogDialog/logDialog",
	"com/ivancio/zal30-ui5/state/ViewConfState"
], function (BaseController, MessageToast, MessageBox, constants, logDialog, ViewConfState) {
	"use strict";

	return BaseController.extend("com.ivancio.zal30-ui5.controller.ViewData", {

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

			// para la página actual del router se le indica que llame al método _onRouteMatched de la propia clase. Esto hará que cada
			// vez que se entre al detalle se llamará a dicho método
			this._oOwnerComponent.getRouter().getRoute(this._mSections.viewData).attachPatternMatched(this._onRouteMatched, this);

			// Se instancia el control LogDialog
			if (!this._oLogDialog) {
				this._oLogDialog = new logDialog();
				this.getView().addDependent(this._oLogDialog);
			}
		},
		// Botón de ir hacía atras en la aplicación
		onNavBack: function (oEvent) {
			window.history.go(-1);
		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		// Método que entra cuando se hace a la página desde la routing
		_onRouteMatched: function (oEvent) {

			// Se recupera si se ha entrado por la vista de selección de vistas			
			var viewSelect = this._oAppDataModel.getProperty("/viewSelect");

			this._oAppDataModel.setProperty("/section", this._mSections.viewData);

			// Se recupera el nombre de la vista
			var sViewName = oEvent.getParameter("arguments").view;

			// Se guarda en el modelo
			this._oViewDataModel.setProperty("/viewName", sViewName);
			this._oViewDataModel.setProperty("/viewDesc", "");

			// Se muestra el loader para toda la aplicación porque se van a empezar a llamar servicios y puede demorarse un poco
			this._oOwnerComponent.showBusyDialog();

			var that = this;

			// Si la página viene de la selección de vista se valida que la vista pasada por parametro es valida y no se ha
			// modificado
			if (viewSelect) {
				var mViewInfo = this._viewConfState.getViewInfo(sViewName);

				// Se inicia el proceso de lectura de la configuración de la vista y de sus datos.
				this._readView(sViewName);

				if (mViewInfo) {
					this._oViewDataModel.setProperty("/viewDesc", mViewInfo.VIEWDESC);
				} else {
					// Si no existe se devuelve el mensaje error que no es valida o no tiene autorizacion y se vuelve a la pantalla de seleccion
					// Mensaje de vista 
					MessageToast.show(this._oI18nResource.getText("ViewSelect.viewNotValid"));

					// Si se ha accedido por la vista de selección se redirige a dicha página si no es valida
					that.navRoute(this._mSections.viewSelect);

				}

			} else {

				// Se llama al mismo método que devuelve la lista de vista pero pasandole la vista concreta que se quiere recuperar.
				this._viewConfState.getViewList({
						viewName: sViewName
					},
					function (mList) {
						that._oOwnerComponent.closeBusyDialog();
						// Solo si devuelve datos se informa la descripción de la vista y se comenzará a buscar los datos
						if (mList[0] && mList[0].VIEWDESC) {
							that._oViewDataModel.setProperty("/viewDesc", mList[0].VIEWDESC);

							// Se inicia el proceso de lectura de la configuración de la vista y de sus datos.
							this._readView(sViewName);

						} else {
							MessageToast.show(that._oI18nResource.getText("ViewSelect.viewNotValid"));
						}

					},
					function () {}
				)

			}

			// Se recupera los datos de la vista para saber la descripcion			
			/*var mViewInfo = this.getViewInfo(sViewName);
			if (mViewInfo) {

				this._oViewDataModel.setProperty("/viewDesc", mViewInfo.VIEWDESC);

				// Leo si se tiene que hacer la verificación, si es así se llama al método que la realizará
				if (this._oAppDataModel.getProperty("/checkAuthView"))
					this._checkAuthView(sViewName);

				//this._oViewDataModel.updateBindings(true);
				//this._oAppDataModel.updateBindings(true);


			} else {
				
				// Mensaje de vista 
				MessageToast.show(this._oI18nResource.getText("ViewSelect.viewNotValid"));

				// Si se ha accedido por la vista de selección se redirige a dicha página si no es valida
				this.navRoute(this._mSections.viewSelect);
			}*/


		},
		// Inicialización del modelo de datos
		_initModelData: function () {
			this._oViewDataModel = new sap.ui.model.json.JSONModel();

			this._resetModel(); // Reset, en este caso, creación del modelo de datos

			this.getView().setModel(this._oViewDataModel, constants.jsonModel.viewXMLData);

			// Se recupera la clase que gestiona los estado de la configuración de las vistas			
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);
		},
		// Reset del modelo de datos
		_resetModel: function () {
			this._oViewDataModel.setData({
				viewName: '',
				viewDesc: ''
			});
		},
		// Chequeo autorización de la vista
		_checkAuthView: function (sViewName) {
			var that = this; // Se pasa el contexto a otra variable para poder acceder al contexto actual en las siguiente llamadas

			this.checkAuthView(sViewName, {
				success: function (oAuth) {

					if (oAuth.LEVELAUTH == constants.mLevelAuth.non) {
						debugger;
						that._oLogDialog.resetModeData();
						that._oLogDialog.addMessage(constants.mMessageType.error, that._oI18nResource.getText("ViewSelect.viewNotAuth"))
						that._oLogDialog.addMessage(constants.mMessageType.error, that._oI18nResource.getText("ViewSelect.viewNotAuth"))

					} else {

					}
				},
				error: function () {
					that._oOwnerComponent.closeBusyDialog();
				}
			});
		},
		// Proceso en que se leen tanto la configuración de la vista como los datos
		_readView: function (sViewName) {

			// Como el servicio va a encadenar varios servicios se muestra el BusyDialog, si no lo esta ya.
			if (!this._oOwnerComponent.isBusyDialogOpen())
				this._oOwnerComponent.showBusyDialog();

			// Se llama para que se inicie el proceso de lectura
			this._viewConfState.readView(sViewName).then((oView) =>{
				this._oOwnerComponent.CloseBusyDialog();
			});



		}

	});
});
