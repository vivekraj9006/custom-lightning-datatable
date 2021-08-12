import LightningDatatable from 'lightning/datatable';
import DatatablePicklistTemplate from "./picklist-Template.html";

export default class ExtendedDatatable extends LightningDatatable {
    static customTypes = {  
        picklist: {
            template: DatatablePicklistTemplate,
            typeAttributes: ['label', 'placeholder', 'options', 'value','context', 'apiname'],
            standardCellLayout: true,
        },
    };
}