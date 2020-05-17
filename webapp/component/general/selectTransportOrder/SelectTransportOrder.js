sap.ui.define([
		"sap/ui/core/Control",
		"sap/ui/core/Fragment",
		'sap/ui/model/Filter'
	],
	function (Control, Fragment, Filter) {
		"use strict";

		var oSelectTransportOrder = Control.extend("com.ivancio.zal30-ui5.component.general.selectTransportOrder.SelectTransportOrder", {

			metadata: {
				properties: {
					logs: {
						type: "object"
					},
					title: {
						type: "string"
					}
				},
				events: {}
			},
			renderer: {},

			//////////////////////////////////
			//                              //
			//        Public methods        //
			//                              //
			//////////////////////////////////
			// Inicialización del objeto
			init: function () {
				if (Control.prototype.init) {
					Control.prototype.init.apply(this, arguments);
				}
				this._initModel();
			},
			// Muestra el dialogo
			openDialog: function (oController) {
				var that = this;
				this._oController = oController;
				if (!this._oDialog) {
					Fragment.load({
						id: this.getId() + "--SelectTransportOrderDialog",
						name: "com.ivancio.zal30-ui5.component.general.selectTransportOrder.SelectTransportOrder",
						controller: that
					}).then(function (oDialog) {						
						that._oDialog = oDialog;
						that.addDependent(oDialog);
						that._oDialog.open();
					});
				} else {
					this._oDialog.open();
				}


			},
			// Pasa los valores y las funciones que se ejecutarán cuando se seleccione o cancele el proceso. Los parámetros serán:
			/*{
				oHandlerSelected: funcion que se ejecuta cuando se seleccione una orden
				oHandlerCancel: función que se ejecuta cuando se cancelar una orden
				aOrders: un array con las ordenes con la siguientes estructura
				title: titulo de la ventana
				[{				
				"order": "NPLK900022",
				"user": "DEVELOPER",							
				"description": "Pruebas"
				}]
			}
			*/
			setValues: function (mParams) {
				this._oHandlerSelected = mParams.oHandlerSelected ? mParams.oHandlerSelected : {};
				this._oHandlerCancel = mParams.oHandlerCancel ? mParams.oHandlerCancel : {};
				this._oSelectTransportOrderModel.setProperty("/orders", mParams.aOrders ? mParams.aOrders : []);
				this._oSelectTransportOrderModel.setProperty("/title", mParams.title ? mParams.title : '');

			},
			// Evento al seleccionar una orden
			onSelectedOrder: function (oEvent) {
				this._resetFilter(oEvent); // Se quita el posible filtro introducido

				// Se ejecuta la función pasada por parámetro
				var aContexts = oEvent.getParameter("selectedContexts");
				if (aContexts && aContexts.length) {

					// Se recupera la línea seleccionada
					var mRow = this._oSelectTransportOrderModel.getProperty(aContexts[0].sPath)

					// Se pasa la orden
					this._oHandlerSelected(mRow.order);
				}

			},
			// Evento al cancelar la selección
			onCancelOrder: function (oEvent) {
				this._resetFilter(oEvent); // Se quita el posible filtro introducido

				// Se ejecuta la función pasada por parámetro
				this._oHandlerCancel();

			},
			// Evento al buscar en la tabla
			onSearch: function (oEvent) {

				var sValue = oEvent.getParameter("value");
				var aFilters = [];
				
				// Solo se han introducido se creará el filtro. Si no han puesto valor serán todos los datos
				if (sValue && sValue.length > 0) {
					// El filtro puede ser por orden o descripción				
					var oFilter = new Filter({
						filters: [
							new Filter("description", sap.ui.model.FilterOperator.Contains, sValue),
							new Filter("order", sap.ui.model.FilterOperator.Contains, sValue)
						],
						and: false
					});
				}
				aFilters.push([oFilter]);


				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter(aFilters);

			},
			//////////////////////////////////
			//                              //
			// Private Methods              //
			//                              //
			//////////////////////////////////
			_initModel: function () {
				this._oSelectTransportOrderModel = new sap.ui.model.json.JSONModel();
				this.setModel(this._oSelectTransportOrderModel, "selectTransportOrderModel");
			},
			// Eliminación del filtro en la tabla
			_resetFilter(oEvent) {
				// reset the filter
				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter([]);
			}

		});
		return oSelectTransportOrder;
	});
