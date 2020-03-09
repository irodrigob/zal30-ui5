sap.ui.define([
	"com/ivancio/zal30-ui5/controller/Base.controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/component/general/LogDialog/logDialog",
	"sap/ui/table/Column",
	"sap/m/Text",
	"sap/m/Input",
	"sap/m/DatePicker",
	"sap/m/TimePicker",
	"sap/m/CheckBox"
], function (BaseController, MessageToast, MessageBox, constants, logDialog, Column, Text, Input, DatePicker, TimePicker, CheckBox) {
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

			let oView = this.getView();
		},
		// Botón de ir hacía atras en la aplicación
		onNavBack: function (oEvent) {
			window.history.go(-1);
		},
		// Construcción de las columnas
		columnFactory: function (sId, oContext) {
			var mColumn = this._oViewDataModel.getProperty(oContext.sPath);

			return new Column(sId, {
				visible: true,
				sortProperty: mColumn.name,
				filterProperty: mColumn.name,
				width: "auto",
				label: new sap.m.Label({
					text: mColumn.headerText
				}),
				hAlign: "Begin",
				template: this._getTemplateObjectforTableColumn(mColumn)
			});

		},
		onTesting: function (oEvent) {
			debugger;
		},
		// Evento que se dispara cuando se modifica el valor de algun registros
		onValueChange: function (oEvent) {

			// Objeto donde se ha cambiado el valor
			var oSource = oEvent.getSource();

			// Registro de la tabla donde se ha modificado
			var oParent = oSource.getParent();
			var sPath = oParent.getBindingContext("ViewData").getPath();
			//var mRow = this._oViewDataModel.getProperty(sPath);

			// Columna donde se ha cambiado el valor
			//var sColumn = oSource.getAggregation("customData")[0].getValue();

			var mResult = this._viewDataState.onValueCellChanged({
				path: oParent.getBindingContext("ViewData").getPath(),
				column: oSource.getAggregation("customData")[0].getValue().columnName,
				objetType:oSource.getAggregation("customData")[0].getValue().objectType,
				value: oSource.getAggregation("customData")[0].getValue().objectType == constants.columnObjectType.checkbox ? oSource.getSelected() : oSource.getValue()
			});

			oEvent.getSource().setValue(mResult.value);

		},
		onInputNumberChanged: function (oEvent) {

			var nValue = oEvent.getSource().getValue();
			nValue.replace(/[^\d|.,]/g, '');

			/*mRow[sColumn] = nValue;
			this._oViewDataModel.setProperty(sPath, mRow);*/


			/*var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				decimals: 2,
				groupingSeparator: this._oOwnerComponent.getUserConfig().thousandSeparator,
				decimalSeparator: this._oOwnerComponent.getUserConfig().decimalSeparator,
				maxFractionDigits: this._oOwnerComponent.getUserConfig().decimalSeparator
			});
			oFormat.format(nValue);*/

			oEvent.getSource().setValue(nValue);
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

				if (mViewInfo) {
					// Se inicia el proceso de lectura de la configuración de la vista y de sus datos.
					this._readView(sViewName);
					//this._oViewDataModel.setProperty("/viewDesc", mViewInfo.VIEWDESC);
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
							that._readView(sViewName);

						} else {
							MessageToast.show(that._oI18nResource.getText("ViewSelect.viewNotValid"));
						}

					},
					function () {}
				)

			}
		},
		// Inicialización del modelo de datos
		_initModelData: function () {
			this._oViewDataModel = new sap.ui.model.json.JSONModel();

			this._resetModel(); // Reset, en este caso, creación del modelo de datos

			this.getView().setModel(this._oViewDataModel, constants.jsonModel.viewData);

			// Se recupera la clase que gestiona los estado de la configuración y datos de las vistas			
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);
			this._viewDataState = this._oOwnerComponent.getState(this._oOwnerComponent.state.dataView);
		},
		// Reset del modelo de datos
		_resetModel: function () {
			this._oViewDataModel.setData({
				viewName: '',
				viewDesc: ''
			});
		},
		// Proceso en que se leen tanto la configuración de la vista como los datos
		_readView: function (sViewName) {

			var that = this;

			// Como el servicio va a encadenar varios servicios se muestra el BusyDialog, si no lo esta ya.
			if (!this._oOwnerComponent.isBusyDialogOpen())
				this._oOwnerComponent.showBusyDialog();

			// Determinación del modo de edición segun el nivel de autorización
			this._viewDataState.determineEditModebyAuthLevel(sViewName);

			// Lectura de los datos y configuracuón de la vista
			this._viewDataState.readConfDataView({
					viewName: sViewName,
					fromViewData: true
				}, function () {
					that._oOwnerComponent.closeBusyDialog(); // Se cierra el dialogo


					// Se guarda en el modelo el nombre y descripción de la vista
					that._oViewDataModel.setProperty("/viewName", that._viewDataState.getViewInfo().viewName);
					that._oViewDataModel.setProperty("/viewDesc", that._viewDataState.getViewInfo().viewDesc);

					// Se mira si la tabla esta bloqueda para mostrar un mensaje indicandolo
					if (that._viewDataState.getViewAlreadyLocked()) {
						var sMessage = that._oI18nResource.getText("viewData.lockedView") + " " + that._viewDataState.getUserAlreadyBlocked();
						MessageToast.show(sMessage);
					}

					// Se llama al método encargado de construir la tabla a mostrar
					that._buildTableData();
				},
				function (oError) {
					that._oOwnerComponent.closeBusyDialog();
				});

		},
		// Se construye los datos para poder pintar los datos en la tabla
		_buildTableData: function () {

			// Se recuperarán las columnas
			this._oViewDataModel.setProperty("/columns", this._viewDataState.getColumnsTable());

			// Se recuperarán los datos			
			this._oViewDataModel.setProperty("/values", this._viewDataState.getViewData());

		},
		// Devuelve un objeto de tipo "template" en base al tipo de campo y sus atributos y teniendo en cuenta su modo de visualización
		_getTemplateObjectforTableColumn: function (mColumn) {

			// Devuelve si se puede editar la vista	
			var bEdit = this._viewDataState.isViewEditable();

			// Se usa los customData para pasar información. La general será la del nombre de la columna. Despuées
			// hay especificas a nivel de objeto, que aun inicializandose aquí se informarán segun el objeto
			var mCustomData = {
				Type: "sap.ui.core.CustomData",
				key: "customValues",
				value: {
					columnaName: mColumn.name,
					objectType: ""
				}
			};

			switch (mColumn.type) {
				case constants.columnTtype.char:
					if (mColumn.checkBox == true) {
						mCustomData.value.objectType = constants.columnObjectType.checkbox;
						return new CheckBox({
							selected: {
								path: "ViewData>" + mColumn.name
							},
							editable: bEdit,
							select: [this.onValueChange, this],
							customData: mCustomData
						})
					} else {
						mCustomData.value.objectType = constants.columnObjectType.input;
						return new Input({
							value: {
								path: "ViewData>" + mColumn.name
							},
							editable: bEdit,
							required: mColumn.mandatory,
							maxLength: mColumn.len,
							change: [this.onValueChange, this],
							customData: mCustomData
						})
					}

					break;
				case constants.columnTtype.date:
					mCustomData.value.objectType = constants.columnObjectType.datePicker;
					return new DatePicker({
						value: {
							path: "ViewData>" + mColumn.name
						},
						editable: bEdit,
						required: mColumn.mandatory,
						valueFormat: this._oOwnerComponent.getUserConfig().dateFormat,
						displayFormat: this._oOwnerComponent.getUserConfig().displayDateFormat,
						change: [this.onValueChange, this],
						customData: mCustomData
					})
					break;
				case constants.columnTtype.time:
					mCustomData.value.objectType = constants.columnObjectType.timePicker;
					return new TimePicker({
						value: {
							path: "ViewData>" + mColumn.name
						},
						editable: bEdit,
						required: mColumn.mandatory,
						valueFormat: this._oOwnerComponent.getUserConfig().timeFormat,
						displayFormat: this._oOwnerComponent.getUserConfig().displayTimeFormat,
						customData: mCustomData,
						change: [this.onValueChange, this]
					})
					break;
				case constants.columnTtype.packed:
					mCustomData.value.objectType = constants.columnObjectType.input;
					return new Input({
						value: {
							path: "ViewData>" + mColumn.name,
							type: 'sap.ui.model.type.Float',
							formatOptions: {
								decimals: mColumn.decimals,
								groupingSeparator: this._oOwnerComponent.getUserConfig().thousandSeparator,
								decimalSeparator: this._oOwnerComponent.getUserConfig().decimalSeparator,
								maxFractionDigits: this._oOwnerComponent.getUserConfig().decimalSeparator
							}
						},
						editable: bEdit,
						required: mColumn.mandatory,
						maxLength: mColumn.len,
						change: [this.onValueChange, this],
						customData: mCustomData
					});
					break;
			}

		}

	});
});
