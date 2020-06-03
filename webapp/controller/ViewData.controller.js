sap.ui.define([
	"com/ivancio/zal30-ui5/controller/Base.controller",
	"sap/m/MessageToast",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/component/general/logDialog/LogDialog",
	"sap/ui/table/Column",
	"sap/ui/core/message/Message",
	"sap/m/Input",
	"sap/m/DatePicker",
	"sap/m/TimePicker",
	"sap/m/CheckBox",
	'sap/ui/model/Filter',
	"com/ivancio/zal30-ui5/component/general/confirmDialog/ConfirmDialog",
	"sap/ui/table/RowSettings",
	"sap/ui/core/Icon",
	"com/ivancio/zal30-ui5/component/viewData/selectTransportOrder/SelectTransportOrder",
	"com/ivancio/zal30-ui5/component/viewData/searchHelp/SearchHelp"
], function (BaseController, MessageToast, constants, LogDialog, Column, Message, Input, DatePicker, TimePicker, CheckBox, Filter, ConfirmDialog, RowSettings, Icon, SelectTransportOrder,
	SearchHelp) {
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
				this._oLogDialog = new LogDialog();
				this.getView().addDependent(this._oLogDialog);
			}

			// se instancia el control del popup de confirmación de dialogo
			if (!this._oConfirmDialog) {
				this._oConfirmDialog = new ConfirmDialog();
				this.getView().addDependent(this._oConfirmDialog);
			}

			// Se instancia el control del popup que permite seleccionar la orden de transporte
			if (!this._oSelectTransportOrderDialog) {
				this._oSelectTransportOrderDialog = new SelectTransportOrder();
				this.getView().addDependent(this._oSelectTransportOrderDialog);
			}

			// Se inicaliza el gestor de mensajes 			
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(oMessageManager.getMessageModel(), "messageApp");
			oMessageManager.registerObject(this.getView(), true);

			// Se instancia el control del popup que permite mostrar la ayuda para búsqueda
			if (!this._oSearcHelpDialog) {
				this._oSearcHelpDialog = new SearchHelp();
				this.getView().addDependent(this._oSearcHelpDialog);
			}

		},
		// Botón de ir hacía atras en la aplicación
		onNavBack: function (oEvent) {
			window.history.go(-1);
		},
		// Construcción de las columnas
		columnFactory: function (sId, oContext) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var that = this;
			var mColumn = oViewDataModel.getProperty(oContext.sPath);

			// Las columnas fijas se crean con ciertas peculiaridad que hace que haya que gestionr ciertos atributos de manera individual
			if (mColumn.fixColumn) {
				switch (mColumn.name) {
					case constants.tableData.fixedColumns.actions:
						return new Column(sId, {
							visible: {
								model: constants.jsonModel.viewData,
								path: constants.tableData.path.visibleFixColumnAction
							},
							sortProperty: mColumn.name,
							filterProperty: mColumn.name,
							width: "3em",
							label: new sap.m.Label({
								text: mColumn.headerText
							}),
							hAlign: "Begin",
							template: this._getTemplateObjectforTableColumn(mColumn)
						});

				};
			} else {
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
			}


		},
		onTesting: function (oEvent) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			debugger;
		},
		// Evento que se dispara cuando se modifica el valor de algun registros
		onValueChange: function (oEvent) {
			var that = this;

			// Aunque la vista no es editable alguno objetos, como el checkbox, provocan que salte este evento y dar error en consolo. Por
			// lo controlo y así me aseguro que ningún dato se modifica
			if (this._viewDataState.isViewEditable()) {


				// Objeto donde se ha cambiado el valor
				var oSource = oEvent.getSource();

				// Registro de la tabla donde se ha modificado
				var oRow = oSource.getParent();
				var sPath = oRow.getBindingContext(constants.jsonModel.viewData).getPath();

				// Columna donde se ha cambiado el valor

				var sColumn = this._getCustomDataValue(oSource, constants.tableData.customData.columnName);

				// tipo de objeto usado en la celda
				var sObjectTypeCell = this._getCustomDataValue(oSource, constants.tableData.customData.objectType);

				// Estado que el realiza el proceso de cambio de celda
				var mResult = this._viewDataState.onValueCellChanged({
					path: sPath,
					column: sColumn,
					objetType: sObjectTypeCell,
					value: sObjectTypeCell == constants.tableData.columnObjectType.checkbox ? oSource.getSelected() : oSource.getValue(),
					handlerPostServiceSAP: function () {
						that._postSAPProcess();
					}
				});
				oEvent.getSource().setValue(mResult.value);

			}



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

					that._viewDataState.onDeleteEntries(aIndices, function () {
						that._postSAPProcess();
						var oTable = that.byId(constants.objectsId.viewData.tableData);
						oTable.getBinding("rows").applyFilter(); // Se vuelven aplicar los filtros definidos		
						oTable.updateRows(); // Se actualizan los datos de las filas para que se refresque la tabla	
						// Fuerzo la deseleccion de los registros porque quedan marcados internamente. 
						oTable.setSelectedIndex(-1);
					});

				},
				oCallBackEndButton: {}
			});
			this._oConfirmDialog.openDialog(this);

		},
		// Evento que se alnza cuando se pulsa el botón de añadir nueva entrada
		onAddEntry: function (oEvent) {
			var that = this;
			this._viewDataState.onAddEntry(function () {
				that._postSAPProcess();
			});

		},
		onRowSelectionChange: function (oEvent) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Filas selecciondas	
			oEvent.getParameter("rowIndices");

			var aIndices = this.byId(constants.objectsId.viewData.tableData).getSelectedIndices();

			var bEnabled = aIndices.length ? true : false;
			oViewDataModel.setProperty("/btnDeletedEnabled", bEnabled);

			// Para poder transportar las líneas seleccionadas tienen que existir en SAP. Los registros nuevos
			// no se pueden transportar si no se graban
			if (this._viewDataState.getRowIndexExistinSAPFromIndices(aIndices).length && bEnabled)
				oViewDataModel.setProperty("/btnTransportEnabled", true);
			else
				oViewDataModel.setProperty("/btnTransportEnabled", false);

		},
		onSaveData: function (oEvent) {

			var that = this;

			sap.ui.getCore().getMessageManager().removeAllMessages(); // Se limpian los mensajes anterior	

			// Si la vista permite transportar entonces se lanza el proceso de selección de la orden de transporte
			if (this._viewDataState.getAllowedTransport()) {

				// Se pasa el código que se ejecutará cuando se seleccione la orden
				this._selectTransportOrder({
					handlerOrderSelected: function () {

						// Se muestra el loader del proceso ocupado porque la grabación puede tardar 
						that._oOwnerComponent.showBusyDialog();

						// Se lanza el proceso de grabación
						that._viewDataState.onSaveData(that._transportOrder, function (aReturn, sNewOrder) {

							// Procesos que se lanzan una vez grabados los datos
							that._postSaveSAPProcess(aReturn, sNewOrder);
						});
					}
				});
			} else {
				// Si no lo permite entonces se graba lo datos
				this._viewDataState.onSaveData('', function (aReturn) {
					that._postSaveSAPProcess(aReturn);
				});
			}



		},
		// Evento al pulsar el icono de ver el detalle de los mensajes de la fila
		onShowRowStatusMsg: function (oEvent) {
			var oSource = oEvent.getSource();

			// Registro de la tabla donde se 
			var oRow = oSource.getParent();
			var sPath = oRow.getBindingContext(constants.jsonModel.viewData).getPath();

			// Se recuperan los mensajes de la fila seleccionada
			var aMsg = this._viewDataState.getRowStatusMsg(sPath);

			// Se pasa los datos al formato que necesita el componente del logDialog
			var aMsgLogDialog = [];
			for (var x = 0; x < aMsg.length; x++) {
				aMsgLogDialog.push({
					type: aMsg[0].TYPE,
					message: aMsg[x].MESSAGE,
					subtitle: aMsg[x].FIELDNAME ? this._viewDataState.getColumnInfo(aMsg[x].FIELDNAME).headerText : ""
				});
			};
			this._oLogDialog.setValues(this._oI18nResource.getText("ViewData.logDialog.RowStatusMsg.Title"), aMsgLogDialog);
			this._oLogDialog.openDialog();

		},
		// Evento al pulsar el botón de mostrar los mensajes del message manager
		onShowMessageApp: function (oEvent) {
			this._getMessageApp().openBy(oEvent.getSource());
		},
		// Verificación de datos modificados
		onCheckData: function (oEvent) {
			var that = this;

			sap.ui.getCore().getMessageManager().removeAllMessages(); // Se limpian los mensajes anterior	

			// Se muestra el loader del proceso ocupado porque la verificación puede tardar 
			this._oOwnerComponent.showBusyDialog();

			this._viewDataState.onCheckDataChangedSAP(function () {
				that._postSAPProcess();
			}, function (mError) {
				that._handlerErrorSAPServices(mError)
			});

		},
		// Evento al pulsar sobre una ayuda para búsqueda
		onSearchHelpRequest: function (oEvent) {
			var that = this;

			// Objeto donde se ha cambiado el valor
			var oSource = oEvent.getSource();

			// Registro de la tabla donde se ha modificado
			var oRow = oSource.getParent();
			var sPath = oRow.getBindingContext(constants.jsonModel.viewData).getPath();

			// Columna donde se ha cambiado el valor
			var sColumn = this._getCustomDataValue(oSource, constants.tableData.customData.columnName);

			// Recupero la información de la ayuda para búsqueda
			var mInfo = this._viewDataState.getValuesForSearchHelp(sColumn, sPath);

			// Se pasan los valores al dialogo
			this._oSearcHelpDialog.setValues({
				aValues: mInfo.values,
				labelForCode: mInfo.labelForCode,
				labelForDescription: mInfo.labelForDescription,
				oHandlerCancel: function () {
					MessageToast.show(that._oI18nResource.getText("ViewData.searcHelpDialog.canceledSelection"));
				},
				oHandlerSelected: function (sValue) {

					oSource.setValue(sValue);

					that._viewDataState.onValueCellChanged({
						path: sPath,
						column: sColumn,
						value: sValue,
						handlerPostServiceSAP: function () {
							that._postSAPProcess();
						}
					});

				},
				title: this._oI18nResource.getText("ViewData.searcHelpDialog.title", [mInfo.labelForCode])
			});

			// Se abre el popup
			this._oSearcHelpDialog.openDialog();
		},
		// Se transportan las líneas seleccionadas
		onTransportData: function (oEvent) {
			var that = this;

			sap.ui.getCore().getMessageManager().removeAllMessages(); // Se limpian los mensajes	

			// Cuando se recupera los indices para transportar ha quedado claro que algunos de los indices son de datos
			// que provienen de SAP. Ya que en caso contrario el botón de transporte no se habilita. Entonces como puede haber índices
			// mezclados(válidos y no), filtros los válidos

			var aIndices = this._viewDataState.getRowIndexExistinSAPFromIndices(this.byId(constants.objectsId.viewData.tableData).getSelectedIndices())

			// Se pasa el código que se ejecutará cuando se seleccione la orden
			this._selectTransportOrder({
				handlerOrderSelected: function () {

					// Se muestra el loader del proceso ocupado porque la grabación puede tardar 
					that._oOwnerComponent.showBusyDialog();

					// Se lanza el proceso de grabación
					that._viewDataState.onTransportData(that._transportOrder, aIndices, function (aReturn, sNewOrder) {

						that._postTransportSAPProcess(aReturn, sNewOrder);
					});
				}
			});

		},
		//////////////////////////////////
		//                              //
		//        Private methods       //
		//                              //
		//////////////////////////////////
		// Método que entra cuando se hace a la página desde la routing
		_onRouteMatched: function (oEvent) {
			var that = this;

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
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		// Procesos que se lanzan después de llamar a SAP. Están el control de botones, columnas de errores, etc.
		_postSAPProcess: function () {
			// Si hay errores internos, no provenientes de SAP, no se puede realizar ningún acción contra SAP. El motivo
			// que se han de arreglar los registros internos antes de poder hacer nada en SAP
			if (this._viewDataState.isDataWithInternalErrors()) {
				this._setEnabledBtnSaved(false);
				this._setEnabledBtnCheck(false);
				this._setEnabledBtnTransport(false);
			}
			// Si no hay errores se chequea si hay datos modificados. Si es así, se habilita el botón de grabar y verificar
			else if (this._viewDataState.isDataChanged()) {
				this._setEnabledBtnSaved(true);
				this._setEnabledBtnCheck(true);
			} else // Si no cumple las condiciones anteriores se desactivan el boton de grabar y comprobar
			{
				this._setEnabledBtnSaved(false);
				this._setEnabledBtnCheck(false);
			}


			// Se lanza el proceso que determina si se mostrarán las columnas de acción del listado
			this._determineShowFixColumnactions();

			// Se oculta el dialogo de proceso ocupado, porque según en que proceso(grabación o validación) se llama para que no parezca que
			// el sistema esta caído
			this._oOwnerComponent.closeBusyDialog(); // Se cierra el dialogo
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
			oViewDataModel.setProperty("/btnCheckEnabled", false);
			oViewDataModel.setProperty("/btnTransportEnabled", false);

			this._transportOrder = ""; // Orden de transporte

			// Los botones de edición no se vTransportlizan por defecto
			this._setVisibleEditButtons(false);

			sap.ui.getCore().getMessageManager().removeAllMessages(); // Se limpian los mensajes del gestor

		},
		// Proceso en que se leen tanto la configuración de la vista como los datos
		_readView: function (sViewName) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			var that = this;

			// Como el servicio va a encadenar varios servicios se muestra el BusyDialog, si no lo esta ya.
			if (!this._oOwnerComponent.isBusyDialogOpen())
				this._oOwnerComponent.showBusyDialog();

			// Lectura de los datos y configuracuón de la vista
			this._viewDataState.processReadConfDataView({
					viewName: sViewName,
					fromViewData: true
				}, function () {
					that._oOwnerComponent.closeBusyDialog(); // Se cierra el dialogo


					// Se guarda en el modelo el nombre y descripción de la vista					
					oViewDataModel.setProperty("/viewName", that._viewDataState.getViewInfo().viewName);
					oViewDataModel.setProperty("/viewDesc", that._viewDataState.getViewInfo().viewDesc);

					// Se guarda en el modelo si se puede transportar
					oViewDataModel.setProperty("/allowedTransport", that._viewDataState.getAllowedTransport());

					// Se mira si la tabla esta bloqueda para mostrar un mensaje indicandolo
					if (that._viewDataState.getViewAlreadyLocked()) {
						var sMessage = that._oI18nResource.getText("viewData.lockedView") + " " + that._viewDataState.getUserAlreadyBlocked();
						MessageToast.show(sMessage);
					}

					// Obtención de los datos auxiliares. Aunque de momento solo se lee un dato auxiliar(las ayudas para búsqueda), dejo preparado
					// el código para que cada tipo de datos auxiliar tenga su propia función de post proceso
					that._viewDataState.getAuxiliaryData({});

					// Se llama al método encargado de construir la tabla a mostrar
					that._buildTableData();
				},
				function (oError) {
					that._oOwnerComponent.closeBusyDialog();
				});

		},
		// Se construye los datos para poder pintar los datos en la tabla
		_buildTableData: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se establece las propiedades del layout de la tabla
			this._setInitialTableDataLayout();



			// Se define los row settings de la columna
			// El Row setting para hacer los highlight se hace por código porque en la vista XML View no funciona con la opción de formatter
			this._setRowSettings();

			// Se definen las rowAction de la tabla. Inicialmente solo contendrá la visualización de mensajes de error
			this._setRowActions();

			// La columna fija de accion por defecto se oculta
			oViewDataModel.setProperty(constants.tableData.path.visibleFixColumnAction, false);

			// Si el modo de edición es de solo lectura entonces se oculta los botones asociados a la edición	
			if (this._viewDataState.isViewEditable()) {
				this._setVisibleEditButtons(true);

				// En dición se establece el filtro de borrado. Es decir, no se ven los registros borrados
				this._setFilterRowsDeleted();

			} else {
				this._setVisibleEditButtons(false);
			}

		},
		// Se define los row setting de la tabla
		_setRowSettings: function () {
			var oTable = this.byId(constants.objectsId.viewData.tableData);
			oTable.setRowSettingsTemplate(new RowSettings({
				highlight: {
					parts: [{
						model: constants.jsonModel.viewData,
						path: constants.tableData.internalFields.rowStatus
					}, {
						model: constants.jsonModel.viewData,
						path: constants.tableData.internalFields.rowStatusInternal
					}],
					formatter: function (sStatus, sStatusInternal) {
						if (sStatus == constants.tableData.rowStatusValues.error || sStatusInternal == constants.tableData.rowStatusValues.error)
							return 'Error';
						else if (sStatus == constants.tableData.rowStatusValues.valid || sStatusInternal == constants.tableData.rowStatusValues.valid)
							return 'Success';
						else
							return 'None';

					}
				},
				highlightText: {
					parts: [{
						model: constants.jsonModel.viewData,
						path: constants.tableData.internalFields.rowStatusMsg
					}, {
						model: constants.jsonModel.viewData,
						path: constants.tableData.internalFields.rowStatusMsgInternal
					}],
					formatter: function (aStatus, aStatusInternal) {
						var aMsg = [];

						if (aStatus)
							aMsg = aStatus;

						if (aStatusInternal)
							aMsg = aMsg.concat(aStatusInternal);

						return aMsg;
					}
				}
			}));

		},
		// Row actions de la tabla
		_setRowActions: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// se guarda el modelo el número de acciones que se mostrarán. Con un máximo de 2 que se pueden visualizar a la vez.
			oViewDataModel.setProperty(constants.tableData.path.tableRowActionCount, 0);

			/*// Array con los items
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
			oTable.setRowActionTemplate(oRowAction);*/
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

				// Las columnas fijas se crean con otros objetos
				if (mColumn.fixColumn) {

					switch (mColumn.name) {

						case constants.tableData.fixedColumns.actions:
							return this._addActionFixColum();
							break;
					};

				} else {

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
										path: mColumn.name + constants.tableData.suffixEditField,
										formatter: function (bValue) {
											return bValue;
										}
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
										path: mColumn.name + constants.tableData.suffixEditField,
										formatter: function (bValue) {
											return bValue;
										}
									},
									required: mColumn.mandatory,
									maxLength: mColumn.len,
									change: [this.onValueChange, this],
									customData: mCustomData,
									showValueHelp: {
										model: constants.jsonModel.viewData,
										path: mColumn.name + constants.tableData.suffixSearchHelpField
									},
									valueHelpRequest: [this.onSearchHelpRequest, this],
									valueState: {
										model: constants.jsonModel.viewData,
										path: mColumn.name + constants.tableData.suffixValueState.valueState
									},
									valueStateText: {
										model: constants.jsonModel.viewData,
										path: mColumn.name + constants.tableData.suffixValueState.valueStateText
									}

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
									path: mColumn.name + constants.tableData.suffixEditField,
									formatter: function (bValue) {
										return bValue;
									}
								},
								required: mColumn.mandatory,
								valueFormat: this._oOwnerComponent.getUserConfig().dateFormat,
								displayFormat: this._oOwnerComponent.getUserConfig().displayDateFormat,
								change: [this.onValueChange, this],
								customData: mCustomData,
								placeholder: "Enter date...",
								valueState: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueState
								},
								valueStateText: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueStateText
								}
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
									path: mColumn.name + constants.tableData.suffixEditField,
									formatter: function (bValue) {
										return bValue;
									}
								},
								required: mColumn.mandatory,
								valueFormat: this._oOwnerComponent.getUserConfig().timeFormat,
								displayFormat: this._oOwnerComponent.getUserConfig().displayTimeFormat,
								customData: mCustomData,
								change: [this.onValueChange, this],
								valueState: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueState
								},
								valueStateText: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueStateText
								}
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
									path: mColumn.name + constants.tableData.suffixEditField,
									formatter: function (bValue) {
										return bValue;
									}
								},
								required: mColumn.mandatory,
								maxLength: mColumn.len,
								change: [this.onValueChange, this],
								customData: mCustomData,
								valueState: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueState
								},
								valueStateText: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueStateText
								}
							});
							break;
						case constants.columnTtype.integer:
							mCustomData[1].value = constants.tableData.columnObjectType.input;
							return new Input({
								value: {
									model: constants.jsonModel.viewData,
									path: mColumn.name,
									type: 'sap.ui.model.type.Integer',
									formatOptions: {
										decimals: mColumn.decimals,
										groupingSeparator: this._oOwnerComponent.getUserConfig().thousandSeparator
									}
								},
								editable: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixEditField,
									formatter: function (bValue) {
										return bValue;
									}
								},
								required: mColumn.mandatory,
								maxLength: mColumn.len,
								change: [this.onValueChange, this],
								customData: mCustomData,
								valueState: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueState
								},
								valueStateText: {
									model: constants.jsonModel.viewData,
									path: mColumn.name + constants.tableData.suffixValueState.valueStateText
								}
							});
							break;
					}
				}
			}

		},
		// Columna fija de acciones
		_addActionFixColum: function () {
			// El icono de consultar el status
			if (this._viewDataState.isViewEditable()) {
				return new Icon({
					src: "sap-icon://search",
					press: [this.onShowRowStatusMsg, this],
					visible: {
						parts: [{
							model: constants.jsonModel.viewData,
							path: constants.tableData.internalFields.rowStatus
						}, {
							model: constants.jsonModel.viewData,
							path: constants.tableData.internalFields.rowStatusInternal
						}],
						formatter: function (sStatus, sStatusInternal) {
							if (sStatus == constants.tableData.rowStatusValues.error || sStatusInternal == constants.tableData.rowStatusValues.error)
								return true;
							else
								return false;
						}
					}
				});
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
			var aObjects = [];
			aObjects.push({
				Type: "sap.ui.core.CustomData",
				key: constants.tableData.customData.columnName,
				value: mColumn.name,
				writeToDom: false
			});
			aObjects.push({
				Type: "sap.ui.core.CustomData",
				key: constants.tableData.customData.objectType,
				value: "",
				writeToDom: false
			});

			// El campo de control del registro modificado solo se muestra en la edición
			if (this._viewDataState.isViewEditable()) {
				aObjects.push({
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
				});
			}
			return aObjects;
		},
		// Evento cuando se pulsa en la row action de visualizar los mensajes
		_onShowStatusMsg: function (oEvent) {
			var oRow = oEvent.getParameter("row");
			var oItem = oEvent.getParameter("item");
		},
		_determineShowFixColumnactions: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// La columna de acciones solo se muestra si hay errores intenros o de SAP
			var bHaveError = this._viewDataState.isDataWithInternalErrors() || this._viewDataState.isDataWithSAPErrors() ? true : false;
			oViewDataModel.setProperty(constants.tableData.path.visibleFixColumnAction, bHaveError);

			// En determinados contextos, por ejemplo al añadir una fila, donde se llama este proceso no refresque bien la visualización/ocultación de columnas. Por ello, le doy un empujoncito 
			// para que lo haga.
			var oTable = this.byId(constants.objectsId.viewData.tableData);
			oTable.updateRows();
		},
		// Establece la visibilidad de los objetos asociados a la edición, como los botones de añadir y borrar
		_setVisibleEditButtons(bVisible) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			oViewDataModel.setProperty("/btnDeletedVisible", bVisible);
			oViewDataModel.setProperty("/btnAddVisible", bVisible);
			oViewDataModel.setProperty("/btnSaveVisible", bVisible);
			oViewDataModel.setProperty("/btnCheckVisible", bVisible);

		},
		// Activa/desactiva el botón de grabar
		_setEnabledBtnSaved: function (bEnabled) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			oViewDataModel.setProperty("/btnSaveEnabled", bEnabled);
		},
		// Activa/desactiva el botón de chequear datos
		_setEnabledBtnCheck: function (bEnabled) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			oViewDataModel.setProperty("/btnCheckEnabled", bEnabled);
		},
		// Activa/desactiva el botón de transportar
		_setEnabledBtnTransport: function (bEnabled) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			oViewDataModel.setProperty("/btnTransportEnabled", bEnabled);
		},
		// Se muestran los mensajes de retorno que devuelve SAP
		_showMessageReturn: function (aReturn) {

			// Se pasan los mensajes devueltos al gestor de mensajes				
			for (var x = 0; x < aReturn.length; x++) {
				var messageType;
				switch (aReturn[x].TYPE) {
					case constants.messageType.error:
						messageType = sap.ui.core.MessageType.Error;
						break;
					case constants.messageType.success:
						messageType = sap.ui.core.MessageType.Success;
						break;
					case constants.messageType.warning:
						messageType = sap.ui.core.MessageType.Warning;
						break;
				}
				var oMessage = new Message({
					message: aReturn[x].MESSAGE,
					type: messageType,
					target: "/Dummy",
					processor: this.getView().getModel()
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);


			};

			var aMsgLogDialog = [];
			for (var x = 0; x < aReturn.length; x++) {
				aMsgLogDialog.push({
					type: aReturn[x].TYPE,
					message: aReturn[x].MESSAGE
				});
			};
			this._oLogDialog.setValues(this._oI18nResource.getText("ViewData.logDialog.returnMsg.Title"), aMsgLogDialog);
			this._oLogDialog.openDialog();

		},
		// Procesos posteriores al momento de grabación
		_postSaveSAPProcess: function (aReturn, sNewOrder) {

			// En SAP la orden puede cambiar en el proceso de grabación, sobretodo la primera que se selecciona. El motivo es que las funciones
			// de transporte devolverán la tarea donde se ha grabado los datos y no en la orden.
			this._transportOrder = sNewOrder;

			// Procesos posterioris generar a las llamadas
			this._postSAPProcess();

			// Se muestran los mensajes del proceso					
			if (aReturn && aReturn.length > 0) {
				this._showMessageReturn(aReturn);
			}

		},
		// Procesos posteriores al transportar los datos
		_postTransportSAPProcess: function (aReturn, sNewOrder) {

			// En SAP la orden puede cambiar en el proceso de grabación, sobretodo la primera que se selecciona. El motivo es que las funciones
			// de transporte devolverán la tarea donde se ha grabado los datos y no en la orden.
			this._transportOrder = sNewOrder;

			// Procesos posterioris generar a las llamadas
			this._postSAPProcess();

			// Se muestran los mensajes del proceso					
			if (aReturn && aReturn.length > 0) {
				this._showMessageReturn(aReturn);
			}

		},

		// Seleccion, o validación ya ha sido escogida, de la orden de transporte
		_selectTransportOrder: function (mParams) {
			var that = this;

			// Si no hay orden de transporte se llama al servicio para obtenerlo
			if (this._transportOrder == '') {
				this._viewDataState.getUserOrder().then((result) => {
					var aOrders = result.map(row => ({
						order: row.ORDER,
						user: row.USER,
						description: row.DESCRIPTION
					}));

					// Se pasan los valores al dialogo
					this._oSelectTransportOrderDialog.setValues({
						aOrders: aOrders,
						oHandlerCancel: function () {
							MessageToast.show(that._oI18nResource.getText("ViewData.selectTransportOrder.canceledSelection"));
						},
						oHandlerSelected: function (sOrder) {

							that._transportOrder = sOrder; // Se guarda la orden de transporte

							// Se lanza el proceso pasada por parámetor una vez se ha seleccionado la orden
							mParams.handlerOrderSelected();

						},
						title: that._oI18nResource.getText("selectTransportOrderDialog.title")
					});

					// Se abre el popup
					this._oSelectTransportOrderDialog.openDialog();
				}, (error) => {

				});
			} else {
				// Se valida que la orden sea correcta
				this._viewDataState.checkTransportOrder(this._transportOrder).then((result) => {

					// Si hay mensaje es que hay error
					if (result.message != '') {


						// Se resetea la orden que había antes
						that._transportOrder = '';

						// Se lanza el proceso para seleccionar una nueva orde
						that._selectTransportOrder();

						// Se muestra el mensaje
						MessageToast.show(result.message, {
							autoClose: false
						});

					} else {
						// Se muestra el loader del proceso ocupado porque la grabación puede tardar 
						that._oOwnerComponent.showBusyDialog();

						// Si no hay error actualizo la orde de transporte, el motivo es que puede
						// cambiar porque se añade una tarea a la orden que pertenecia a la antigua, etc.
						that._transportOrder = result.newOrder;

						// Se lanza el proceso pasada por parámetor una vez se ha seleccionado la orden
						mParams.handlerOrderSelected();
					}
				}, (error) => {

				});




			}
		},
		// Abre el message manager para visualizar el contenido de los mensajes almacenados
		_getMessageApp: function (oSource) {
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "com.ivancio.zal30-ui5.fragment.messageApp", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},
		_handlerErrorSAPServices:function(){
			this._oOwnerComponent.closeBusyDialog(); // Se cierra el dialogo
		}

	});
});
