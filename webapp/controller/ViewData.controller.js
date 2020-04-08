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
	"sap/m/CheckBox",
	'sap/ui/model/Filter',
	"com/ivancio/zal30-ui5/component/general/confirmDialog/ConfirmDialog",
	"sap/ui/table/RowSettings"
], function (BaseController, MessageToast, MessageBox, constants, logDialog, Column, Text, Input, DatePicker, TimePicker, CheckBox, Filter, ConfirmDialog, RowSettings) {
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

			// se instancia el control del popup de confirmación de dialogo
			if (!this._oConfirmDialog) {
				this._oConfirmDialog = new ConfirmDialog();
				this.getView().addDependent(this._oConfirmDialog);
			}

			let oView = this.getView();
		},
		// Botón de ir hacía atras en la aplicación
		onNavBack: function (oEvent) {
			window.history.go(-1);
		},
		// Construcción de las columnas
		columnFactory: function (sId, oContext) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			var mColumn = oViewDataModel.getProperty(oContext.sPath);

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
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			debugger;
		},
		// Evento que se dispara cuando se modifica el valor de algun registros
		onValueChange: function (oEvent) {

			// Objeto donde se ha cambiado el valor
			var oSource = oEvent.getSource();

			// Registro de la tabla donde se ha modificado
			var oRow = oSource.getParent();
			var sPath = oRow.getBindingContext(constants.jsonModel.viewData).getPath();

			// Columna donde se ha cambiado el valor

			var sColumn = this._getCustomDataValue(oSource, constants.tableData.customData.columnName); // oSource.getAggregation("customData")[0].getValue().columnName;

			// tipo de objeto usado en la celda
			var sObjectTypeCell = this._getCustomDataValue(oSource, constants.tableData.customData.objectType); // oSource.getAggregation("customData")[0].getValue().objectType;
			var mResult = this._viewDataState.onValueCellChanged({
				path: sPath,
				column: sColumn,
				objetType: sObjectTypeCell,
				value: sObjectTypeCell == constants.tableData.columnObjectType.checkbox ? oSource.getSelected() : oSource.getValue()
			});
			oEvent.getSource().setValue(mResult.value);

		},
		// Evento que se lanza cuando se pulsa el boton de borrar entradas 
		onDeleteEntries: function (oEvent) {
			var that = this;
			var aIndices = this.byId(constants.objectsId.viewData.tableData).getSelectedIndices();

			// Se muestra el popup de confirmación

			this._oConfirmDialog.setValues({
				sTitle: this._oI18nResource.getText("ViewData.popupConfDeleteTitle"),
				sTextMessage: this._oI18nResource.getText("ViewData.popupConfDeleteMessage"),
				sBeginButtonText: this._oI18nResource.getText("ViewData.popupConfDeleteBeginButton"),
				sEndButtonText: this._oI18nResource.getText("ViewData.popupConfDeleteEndButton"),
				oCallBackStartButton: function (oEvent) {

					that._viewDataState.onDeleteEntries(aIndices);
					var oTable = that.byId(constants.objectsId.viewData.tableData);
					oTable.getBinding("rows").applyFilter(); // Se vuelven aplicar los filtros definidos		
					oTable.updateRows(); /// Se actualizan los datos de las filas para que se refresque la tabla					
				},
				oCallBackEndButton: {}
			});
			this._oConfirmDialog.openDialog(this);

		},
		// Evento que se alnza cuando se pulsa el botón de añadir nueva entrada
		onAddEntry: function (oEvent) {
			this._viewDataState.onAddEntry();
		},
		onRowSelectionChange: function (oEvent) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Filas selecciondas	
			oEvent.getParameter("rowIndices");

			var bEnabled = this.byId(constants.objectsId.viewData.tableData).getSelectedIndices().length ? true : false;
			oViewDataModel.setProperty("/btnDeletedEnabled", bEnabled);
		},
		onSaveData: function (oEvent) {

		},
		// Devuelve el formato del RowSetting según el valor del campo ZAL30_ROW_STATUS
		formatRowStatus: function (sStatus) {

			switch (sStatus) {
				case constants.tableData.rowStatusValues.error:
					return 'Error';
				case constants.tableData.rowStatusValues.valid:
					return 'Success';
				default:
					return 'None';

			}
		},
		// Texto que tendrá el RowSettign en base a los valores del campo ZAL30_ROW_STATUS_MSG
		formatRowStatusMsg: function (aMsg) {
			if (aMsg && aMsg.length > 0) {
				return aMsg.join();
			} else {
				return '';
			}


		},

		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		// Método que entra cuando se hace a la página desde la routing
		_onRouteMatched: function (oEvent) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se recupera si se ha entrado por la vista de selección de vistas			
			var viewSelect = this._oAppDataModel.getProperty("/viewSelect");

			this._oAppDataModel.setProperty("/section", this._mSections.viewData);

			// Se recupera el nombre de la vista
			var sViewName = oEvent.getParameter("arguments").view;

			// Se guarda en el modelo
			oViewDataModel.setProperty("/viewName", sViewName);
			oViewDataModel.setProperty("/viewDesc", "");

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
							oViewDataModel.setProperty("/viewDesc", mList[0].VIEWDESC);

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
			// Se recupera la clase que gestiona los estado de la configuración y datos de las vistas			
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);
			this._viewDataState = this._oOwnerComponent.getState(this._oOwnerComponent.state.dataView);

			this._resetModel(); // Reset, en este caso, creación del modelo de datos
		},
		// Reset del modelo de datos
		_resetModel: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			oViewDataModel.setProperty("/viewName", '');
			oViewDataModel.setProperty("/viewDesc", '');
			oViewDataModel.setProperty("/btnDeletedEnabled", false);
			oViewDataModel.setProperty("/btnSaveEnabled", false);
			// Los botones de edición no se visualizan por defecto
			this._viewDataState.setVisibleEditButtons(false);
		},
		// Proceso en que se leen tanto la configuración de la vista como los datos
		_readView: function (sViewName) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

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
					oViewDataModel.setProperty("/viewName", that._viewDataState.getViewInfo().viewName);
					oViewDataModel.setProperty("/viewDesc", that._viewDataState.getViewInfo().viewDesc);

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

			// Se establece las propiedades del layout de la tabla
			this._setInitialTableDataLayout();

			// Se establece el filtro de borrado. Es decir, no se ven los registros borrados
			this._setFilterRowsDeleted();

			// Se define los row settings de la columna
			// El Row setting para hacer los highlight se hace por código porque en la vista XML View no funciona con la opción de formatter
			this._setRowSettings();

			// Se definen las rowAction de la tabla. Inicialmente solo contendrá la visualización de mensajes de error
			this._setRowActions();

		},
		// Se define los row setting de la tabla
		_setRowSettings: function () {
			var oTable = this.byId(constants.objectsId.viewData.tableData);
			oTable.setRowSettingsTemplate(new RowSettings({
				highlight: {
					model: constants.jsonModel.viewData,
					path: constants.tableData.internalFields.rowStatus,
					formatter: this.formatRowStatus
				},
				highlightText: {
					model: constants.jsonModel.viewData,
					path: constants.tableData.internalFields.rowStatusMsg,
					formatter: this.formatRowStatusMsg
				}
			}));

		},
		// Row actions de la tabla
		_setRowActions: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			// se guarda el modelo el número de acciones que se mostrarán. Con un máximo de 2 que se pueden visualizar a la vez.
			oViewDataModel.setProperty(constants.tableData.path.tableRowActionCount, 1);

			// Array con los items
			var oItems = [];

			// 1.- Visualización de los mensajes de status
			var fnShowStatusMsg = this._onShowStatusMsg.bind(this);
			var oShowStatusMsg = new sap.ui.table.RowActionItem({
				icon: "sap-icon://search",
				text: this._oI18nResource.getText("ViewData.rowAction.showStatusMsg"),
				press: fnShowStatusMsg
			});
			oItems.push(oShowStatusMsg);

			var oRowAction = new sap.ui.table.RowAction({
				items: oItems
			});

			var oTable = this.byId(constants.objectsId.viewData.tableData);
			oTable.setRowActionTemplate(oRowAction);
			//oTable.setRowActionCount({"viewData>tableRowActionCount"});
		},
		// Filtro de registros borrados
		_setFilterRowsDeleted: function () {

			// se crea el filtro para el campo de actualización
			var oFilter = new Filter(constants.tableData.internalFields.updkz, sap.ui.model.FilterOperator.NE, constants.tableData.fieldUpkzValues.delete);

			this.byId(constants.objectsId.viewData.tableData).getBinding("rows").filter(oFilter);

		},
		// Devuelve un objeto de tipo "template" en base al tipo de campo y sus atributos y teniendo en cuenta su modo de visualización
		_getTemplateObjectforTableColumn: function (mColumn) {

			// Las columnas técnicas ni se mostrarán
			if (!mColumn.tech) {

				// Devuelve si se puede editar la vista	
				var bEdit = this._viewDataState.isViewEditable();

				// Se usa los customData para tener información adicional en las celdas
				var mCustomData = this._getCustomerDataCells(mColumn);

				switch (mColumn.type) {
					case constants.columnTtype.char:
						if (mColumn.checkBox == true) {
							mCustomData[1].value = constants.tableData.columnObjectType.checkbox;
							return new CheckBox({
								selected: {
									model: constants.jsonModel.viewData,
									path: mColumn.name
								},
								editable: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffix_edit_field,
								},
								select: [this.onValueChange, this],
								customData: mCustomData
							})
						} else {
							mCustomData[1].value = constants.tableData.columnObjectType.input;
							return new Input({
								value: {
									model: constants.jsonModel.viewData,
									path: mColumn.name
								},
								editable: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffix_edit_field,
									formatter: function (bValue) {
										return bValue;
									}
								},
								required: mColumn.mandatory,
								maxLength: mColumn.len,
								change: [this.onValueChange, this],
								customData: mCustomData
							})
						}

						break;
					case constants.columnTtype.date:
						mCustomData[1].value = constants.tableData.columnObjectType.datePicker;
						return new DatePicker({
							value: {
								model: constants.jsonModel.viewData,
								path: mColumn.name
							},
							editable: {
								model: constants.jsonModel.viewData,
								path: mColumn.name + constants.tableData.suffix_edit_field,
								formatter: function (bValue) {
									return bValue;
								}
							},
							required: mColumn.mandatory,
							valueFormat: this._oOwnerComponent.getUserConfig().dateFormat,
							displayFormat: this._oOwnerComponent.getUserConfig().displayDateFormat,
							change: [this.onValueChange, this],
							customData: mCustomData
						})
						break;
					case constants.columnTtype.time:
						mCustomData[1].value = constants.tableData.columnObjectType.timePicker;
						return new TimePicker({
							value: {
								model: constants.jsonModel.viewData,
								path: mColumn.name
							},
							editable: {
								model: constants.jsonModel.viewData,
								path: mColumn.name + constants.tableData.suffix_edit_field,
								formatter: function (bValue) {
									return bValue;
								}
							},
							required: mColumn.mandatory,
							valueFormat: this._oOwnerComponent.getUserConfig().timeFormat,
							displayFormat: this._oOwnerComponent.getUserConfig().displayTimeFormat,
							customData: mCustomData,
							change: [this.onValueChange, this]
						})
						break;
					case constants.columnTtype.packed:
						mCustomData[1].value = constants.tableData.columnObjectType.input;
						return new Input({
							value: {
								model: constants.jsonModel.viewData,
								path: mColumn.name,
								type: 'sap.ui.model.type.Float',
								formatOptions: {
									decimals: mColumn.decimals,
									groupingSeparator: this._oOwnerComponent.getUserConfig().thousandSeparator,
									decimalSeparator: this._oOwnerComponent.getUserConfig().decimalSeparator,
									maxFractionDigits: this._oOwnerComponent.getUserConfig().decimalSeparator
								}
							},
							editable: {
								model: constants.jsonModel.viewData,
								path: mColumn.name + constants.tableData.suffix_edit_field,
								formatter: function (bValue) {
									return bValue;
								}
							},
							required: mColumn.mandatory,
							maxLength: mColumn.len,
							change: [this.onValueChange, this],
							customData: mCustomData
						});
						break;
				}
			}

		},
		// Establece el layout inicial de la tabla de datos
		_setInitialTableDataLayout: function () {
			var oTable = this.byId(constants.objectsId.viewData.tableData);

			// Los campos clave se marcan como fijos para facilitar su mantenimiento. Hay que resaltar que se cuentan todos
			// los campos clave incluyendo los que nunca se mostrarán, como el mandante, el motivo es que la tabla los tiene en cuenta
			// aunque no se pinte. Creo que es debido a que si que esta en el modelo de columnas.			
			oTable.setFixedColumnCount(this._viewDataState.getNumberKeyFields());
		},
		// Devuelve el valor de una propieda customData de un objeto
		_getCustomDataValue: function (oObject, skey) {
			var aCustomData = oObject.getAggregation("customData"); // Se recupera los valores

			var oCustomData = aCustomData.find(values => values.getKey() === skey);

			return oCustomData.getValue();
		},
		// Campos de clientes para las celdas de la tabla. Los campos que se añaden son:
		// 1) Nombre de la columna. Con el nombre de la columna se puede saber el tipo de campo
		// 2) Tipo de objeto. Para saber como recuperar sus valore, sobretodo para los checkbox
		_getCustomerDataCells: function (mColumn) {
			return [{
					Type: "sap.ui.core.CustomData",
					key: constants.tableData.customData.columnName,
					value: mColumn.name,
					writeToDom: false
				},
				{
					Type: "sap.ui.core.CustomData",
					key: constants.tableData.customData.objectType,
					value: "",
					writeToDom: false
				},
				{
					Type: "sap.ui.core.CustomData",
					key: constants.tableData.customData.changeRow,
					value: {
						model: constants.jsonModel.viewData,
						path: constants.tableData.internalFields.updkz,
						formatter: function (sUpdkz) {
							return sUpdkz == constants.tableData.fieldUpkzValues.update || sUpdkz == constants.tableData.fieldUpkzValues.insert ? "true" : "false";
						}

					},
					writeToDom: true
				}
			];
		},
		// Evento cuando se pulsa en la row action de visualizar los mensajes
		_onShowStatusMsg: function (oEvent) {
			var oRow = oEvent.getParameter("row");
			var oItem = oEvent.getParameter("item");
			/*MessageToast.show("Item " + (oItem.getText() || oItem.getType()) + " pressed for product with id " +
				this.getView().getModel().getProperty("ProductId", oRow.getBindingContext()));*/
			debugger;
		}


	});
});
