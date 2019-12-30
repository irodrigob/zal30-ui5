sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  'sap/ui/model/Filter',
  'sap/ui/core/Fragment'
], function (Controller, MessageToast, Filter, Fragment) {
  "use strict";

  var inputViewID = '';

  return Controller.extend("com.ivancio.zal30-ui5.controller.viewSelect", {


    onInit: function () {
      this._oOwnerComponent = this.getOwnerComponent();
      this._oAppDataModel = this._oOwnerComponent.getModel("appData");
    },
    //////////////////////////////////
    //                              //
    //        Public methods        //
    //                              //
    //////////////////////////////////
    // Método que gestiona la ayuda para búsqueda de las vistas
    handleViewHelp: function (oEvent) {


      // Se recupera el valor actual para aplicar al filtro de la ventana de vistas
      var sInputValue = oEvent.getSource().getValue();

      // Se guarda en una variable global el ID del input de vistas. Este servirá para posteriormente
      // saber donde guardar el valor
      this.inputViewID = oEvent.getSource().getId();

      // se crea la ayuda para búsqueda si no esta creada previamente
      if (!this._valueHelpDialog) {
        // Se inicializa una variable local con el fragmento creado
        this._valueHelpDialog = sap.ui.xmlfragment(
          "com.ivancio.zal30-ui5.Fragment.valueHelpView", // Nombre del fragment
          this // Controlador
        );
        // Se asocia el fragmento a la vista para que pueda usar modelo, controlador, etc..
        this.getView().addDependent(this._valueHelpDialog);
      }

      // Se crea el filtro pasandole el valor informado en el campo de input
      this._valueHelpDialog.getBinding("items").filter([new Filter("VIEWDESC", sap.ui.model.FilterOperator.Contains, sInputValue)]);

      // Se abre el dialogo 
      this._valueHelpDialog.open();
    },
    //////////////////////////////////
    //                              //
    //        Private methods       //
    //                              //
    //////////////////////////////////
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
        var ViewInput = this.byId(this.inputViewID);
        // Se guarda el nombre de la vista seleccionado
        debugger;
        var value = oSelectedItem.getTitle();
        ViewInput.setValue(value);
      }
      // se elimina los filtros
      oEvent.getSource().getBinding("items").filter([]);
    }
  });
});
