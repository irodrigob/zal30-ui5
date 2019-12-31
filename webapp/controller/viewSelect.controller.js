sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  'sap/ui/model/Filter',
  'sap/ui/core/Fragment',
  "com/ivancio/zal30-ui5/controller/Base.controller"
], function (Controller, MessageToast, Filter, Fragment, BaseController) {
  "use strict";

  var _inputViewID = ''; // Guarda el ID del control input para introducir la vista
  var _viewSelected = ''; // Guardará la vista seleccionada

  return Controller.extend("com.ivancio.zal30-ui5.controller.ViewSelect", {

    //////////////////////////////////
    //                              //
    //        Public methods        //
    //                              //
    //////////////////////////////////
    onInit: function () {
      this._oOwnerComponent = this.getOwnerComponent();
      this._oAppDataModel = this._oOwnerComponent.getModel("appData");
      
    },

    // MC)todo que gestiona la ayuda para bC:squeda de las vistas
    onHandleViewHelp: function (oEvent) {
      // Se recupera el valor actual para aplicar al filtro de la ventana de vistas
      var sInputValue = oEvent.getSource().getValue();

      // Se guarda en una variable global el ID del input de vistas. Este servirC! para posteriormente
      // saber donde guardar el valor
      this.inputViewID = oEvent.getSource().getId();

      // se crea la ayuda para bC:squeda si no esta creada previamente
      if (!this._valueHelpDialog) {
        // Se inicializa una variable local con el fragmento creado
        this._valueHelpDialog = sap.ui.xmlfragment(
          "com.ivancio.zal30-ui5.Fragment.valueHelpView", // Nombre del fragment
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
      
debugger;

      jQuery.sap.log.info("View selected: " + this._viewSelected);

      // Recuperamos la vista introducida       
      var viewInput = this.byId(this.inputViewID);
      
    },
    // Vista seleccionada según la sugerencia de valorees
    suggestionViewSelected: function (oEvent) {
			var oItem = oEvent.getParameter('selectedItem');
      this._viewSelected = oItem ? oItem.getKey() : '';

			
		},
    //////////////////////////////////
    //                              //
    //        Private methods       //
    //                              //
    //////////////////////////////////
    // MC)todo que permite filtrar un valor en la ayuda para bC:squeda
    _handleViewHelpSearch: function (oEvent) {
      // Se recupera el valor introducido en la ayuda para bC:squeda
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
        var ViewInput = this.byId(this.inputViewID);

        // En el título se ha puesto el nombre técnico de la vista, que se aprovecha para guardarlo en la variable 
        this._viewSelected = oSelectedItem.getTitle();
        ViewInput.setSelectedKey(this._viewSelected);
      }
      // se elimina los filtros
      oEvent.getSource().getBinding("items").filter([]);
    }
  });
});
