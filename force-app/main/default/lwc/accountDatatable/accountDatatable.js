import { LightningElement, wire, track, api } from 'lwc';
import { reduceErrors } from 'c/ldsUtils';
import getFieldSetAndRecords from '@salesforce/apex/picklistDatatableEditContoller.getFieldSetAndRecords';
import upsertSOBJRecord from '@salesforce/apex/picklistDatatableEditContoller.upsertSOBJRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUpdatedDataOnly from '@salesforce/apex/picklistDatatableEditContoller.getUpdatedDataOnly';
import updateRecords from '@salesforce/apex/picklistDatatableEditContoller.updateRecords';
import deleteRecords from '@salesforce/apex/picklistDatatableEditContoller.deleteRecords';
export default class AccountDatatable extends LightningElement {
    @api isLoaded = false;
    @track allData = []; // Datatable
    allDataOrgCopy = []; // DatatableOrignalCpy
    @track columns = [];
    @track searchKey = '';
    @track replacetext = [];
    @track copyColumns = [];
    @track fieldOption = '';
    @track fieldOptionJSON = []; // list of fields option for combobox
    @track FieldsValue; // default value of combobox
    @track fieldType; // data type
    @api SFDCobjectApiName;
    @api fieldSetName;
    fieldName;
    listOfFieldsCopy = [];
    draftValues = [];
    AddButonCounter = 0;
    allValuesAndData;
    @track picklistPushVal = [];
    @track isNewRec = false;
    isSearchFlag = false;
    takeActionConVal = 'AND'; // from child 
    @track filterState = false;
    @api showfilter;
    @api showSearchAndReplace;
    @api showAddRow;
    @api showDeleteBtn;
    isDateType = false;
    isDateTimeType = false;
    isTimeType = false;
    isPicklistType = false; // forPicklist if available;
    isStringType = true;
    // InfinScroll
    // PaginationType = 'Infinite_Scroll'; // Infinite scrolling / Standard Pagination
    // isStdPagination = false;
    // isInfinScroll = false;
    @api NumberRows; // NumberRows or Number of Rows to be disply at a Time
    offset = '0';
    dynamicLimit = 0;
    rowIds = []; // Collect row Ids for deletion
    depval_list = {};
 
    connectedCallback() {
        getFieldSetAndRecords({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName,
            dynamicLimit: this.dynamicLimit
        })
            .then(async data => {
                this.isLoading = true;
                let objStr = JSON.parse(data);
                let listOfFields = JSON.parse(Object.values(objStr)[4]);
                this.listOfFieldsCopy = listOfFields;
                console.log('listOfFields:', JSON.stringify(listOfFields)); // Fields
                var listOfRecords = JSON.parse(Object.values(objStr)[3]);
                console.log('listOfRecords:', JSON.stringify(listOfRecords)); // Data/ Records
                var pickListValues = JSON.parse(Object.values(objStr)[2]);
                console.log('pickListValues:', JSON.stringify(pickListValues)); // Picklist
                var DpickListValues_c = JSON.parse(Object.values(objStr)[1]);
                console.log('DpickListValues_c:', JSON.stringify(DpickListValues_c)); // DPicklist
                var DpicListMap_c = JSON.parse(Object.values(objStr)[0]);
                var DpicListMap = {};
                for (let i = 0; i < DpicListMap_c.length; i++) {
                    DpicListMap = { ...DpicListMap, ...DpicListMap_c[i] };
                }
                this.depval_list = DpicListMap;
                console.log('DpicListMap:', JSON.stringify(DpicListMap)); // DPicklist
                var DpickListValues = {};
                for (let j = 0; j < DpickListValues_c.length; j++) {
                    DpickListValues = { ...DpickListValues, ...DpickListValues_c[j] };
                }
                console.log('DpickListValues:', JSON.stringify(DpickListValues)); // Spread Values
                var xx = JSON.stringify(listOfRecords);
                var isdependentflag = false;
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);
                await listOfFields.map(element => {
                    this.isLoading = true;
                    if (element.type == 'picklist') {
                        var childlabel = this.depval_list[element.fieldPath] + '';
                        if (DpickListValues.hasOwnProperty(element.fieldPath)) {
                            isdependentflag = true;
                        } else {
                            isdependentflag = false;
                        }
                        let opt = []; // options of picklist
                        pickListValues.forEach(pic => {
                            if (element.fieldPath == Object.keys(pic)) {
                                opt = pic[element.fieldPath];
                                let colJson =
                                {
                                    fieldName: element.fieldPath,
                                    label: element.label,
                                    type: element.type,
                                    editable: true,
                                    initialwidth: 100,
                                    cellAttributes: { alignment: 'center' },
                                    typeAttributes:
                                    {
                                        placeholder: element.label,
                                        options: opt,
                                        value:
                                        {
                                            fieldName: element.fieldPath
                                        },
                                        context: { fieldName: 'Id' },
                                        dependentoption: DpickListValues,
                                        apiname: element.fieldPath,
                                        variant: 'label-hidden',
                                        name: element.label,
                                        label: element.label,
                                        dependentvalue:
                                        {
                                            fieldName: this.depval_list[element.fieldPath]
                                        },
                                        parentapi: element.fieldPath,
                                        isdependentflag: isdependentflag,
                                        childlabel: childlabel
                                    },
                                    wrapText: true
                                };
                                console.log('colJosn: ', JSON.stringify(colJson));
                                this.columns.push(colJson);
                            }
                        });
                    } else if (element.type == 'datetime') {
                        let datetimeTypeAttr = {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        };
                        let elm = {
                            label: element.label,
                            apiName: element.fieldPath,
                            type: 'date',
                            fieldType: 'text',
                            objectName: this.SFDCobjectApiName,
                            fieldName: element.fieldPath,
                            typeAttributes: datetimeTypeAttr,
                            editable: true,
                        };
                        this.columns.push(elm);
                        console.log(' datetime:', elm);
                    } else if (element.type == 'date') {
                        let dateTypeAttr = {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            timezone: 'Asia/Kolkata',
                            hour12: true
                        };
                        let elm = {
                            label: element.label,
                            apiName: element.fieldPath,
                            type: element.type,
                            fieldType: 'text',
                            objectName: this.SFDCobjectApiName,
                            fieldName: element.fieldPath,
                            typeAttributes: dateTypeAttr,
                            editable: true,
                        };
                        this.columns.push(elm);
                        console.log('elm:', elm);
                    } else if (element.type == 'time') {
                        let timeTypeAttr = {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        };
                        let elm = {
                            label: element.label,
                            apiName: element.fieldPath,
                            type: element.type,
                            fieldType: 'text',
                            objectName: this.SFDCobjectApiName,
                            fieldName: element.fieldPath,
                            typeAttributes: timeTypeAttr,
                            editable: true,
                        };
                        this.columns.push(elm);
                    } else {
                        let elm = {
                            label: element.label,
                            apiName: element.fieldPath,
                            type: element.type,
                            fieldType: 'text',
                            objectName: this.SFDCobjectApiName,
                            fieldName: element.fieldPath,
                            editable: true,
                        };
                        this.columns.push(elm);
                    }
                    // fileds for ComboBox
                    this.fieldOptionJSON = [...this.fieldOptionJSON, {
                        label: element.label,
                        value: element.fieldPath,
                        type: element.type
                    }];
                });
                this.FieldsValue = this.fieldOptionJSON[0].value;
                this.fieldOption = this.fieldOptionJSON[0].value;
            })
            .then(_ => {
                var parseCol = JSON.stringify(this.columns);
                this.columns = JSON.parse(parseCol);
                console.table(this.columns);
                console.log('this.allData:', JSON.parse(JSON.stringify(this.allData)));
                this.error = undefined;
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
                this.allData = undefined;
            });
    }

    picklistChanged(event) {
        event.stopPropagation();
        let dataRecieved = event.detail.data;
        let picklistObj =
        {
            Id: dataRecieved.context,
            [dataRecieved.apiname]: dataRecieved.value
        };
        this.updateDraftValues(picklistObj);
    }

    async handleSave(event) {
        let copyDraftValues = this.draftValues;
        copyDraftValues.forEach((item) => {
            if (item.Id.length < 15) {
                // item.Id = '';
                delete item.Id;
            }
        });
        let dataStringify = JSON.stringify(copyDraftValues);
        console.log('FINAL PUSH : ', dataStringify);
        upsertSOBJRecord({ jSONSObject: dataStringify, sObjectApiName: this.SFDCobjectApiName })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account updated',
                        variant: 'success'
                    })
                );
            }).then(_ => {
                console.log('Sucsss: Saved value' + JSON.stringify(copyDraftValues));
                this.draftValues = [];
                this.getUpdatedData();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
  
    handleCellChange(event) {
        event.preventDefault();
        this.updateDraftValues(event.detail.draftValues[0]);
        console.log('DraftValues handleCellChange ' + JSON.stringify(event.detail.draftValues));
    }
 
    async updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = JSON.parse(JSON.stringify(this.draftValues));
        console.log('Draft values on send:', JSON.stringify(copyDraftValues));
        await copyDraftValues.forEach((item) => {
            if (item.Id == updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
        console.log('UpdateddraftValues :', JSON.stringify(this.draftValues));
        console.log('this.allData After Draft:', JSON.parse(JSON.stringify(this.allData)));
    }
  
    addRow() {
        this.isNewRec = true;
        console.log("add row function called");
        var dynamicArray = this.listOfFieldsCopy;
        console.log('dynamicArray:', dynamicArray);
        var blankObj =
        {
            Id: "row-" + this.AddButonCounter,
            attributes:
            {
                type: this.SFDCobjectApiName,
                url: "",
            },
        };
        for (let i = 0; i < dynamicArray.length; i++) {
            const { fieldPath } = dynamicArray[i];
            blankObj[fieldPath] = "";
        }
        console.log("blank_object", JSON.stringify(blankObj));
        this.allData = [blankObj, ...this.allData];
        console.log('this.allData After :', JSON.parse(JSON.stringify(this.allData)));
        this.AddButonCounter = this.AddButonCounter + 1;
    }
 
    getUpdatedData() {
        getUpdatedDataOnly({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName,
            offset: 0
        })
            .then(async data => {
                this.isLoading = true;
                let objStr = JSON.parse(data);
                let listOfRecords = JSON.parse(Object.values(objStr)[0]);
                let xx = JSON.stringify(listOfRecords);
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
            });
    }
 
    handleChangeFields(event) {
        // on chnage of combobox value
        this.fieldOption = event.target.value;
        console.log('fieldOption: ' + this.fieldOption);
        let varfieldType = this.fieldOptionJSON.filter(key => key.value === this.fieldOption);
        let dataType = JSON.parse(JSON.stringify(varfieldType[0]));
        this.fieldType = dataType.type;
        if (this.fieldType == 'datetime') {
            this.isDateType = false;
            this.isDateTimeType = true;
            this.isTimeType = false;
            this.isPicklistType = false; // forPicklist if available;
            this.isStringType = false;
        } else if (this.fieldType == 'time') {
            this.isDateType = false;
            this.isDateTimeType = false;
            this.isTimeType = true;
            this.isPicklistType = false; // forPicklist if available;
            this.isStringType = false;
        } else if (this.fieldType == 'date') {
            this.isDateType = true;
            this.isDateTimeType = false;
            this.isTimeType = false;
            this.isPicklistType = false; // forPicklist if available;
            this.isStringType = false;
        } else {   //if(this.fieldType == 'string')
            this.isDateType = false;
            this.isDateTimeType = false;
            this.isTimeType = false;
            this.isPicklistType = false; // forPicklist if available;
            this.isStringType = true;
        }
        console.log(' this.fieldType: ' + dataType.type);
    }
    get FieldsOptions() {
        // combobox option set
        return this.fieldOptionJSON;
    }
 
    handleKeyChange(event) {
        try {
            this.searchKey = event.target.value;
            if (this.searchKey !== null) {
                //|| this.takeActionConVal !== null
                this.isSearchFlag = true;
                console.log('searchKey', JSON.stringify(this.searchKey));
                this.searchDataTable();
            }
            if (this.searchKey == null || this.searchKey == '') {
                this.allData = this.allDataOrgCopy;
                this.isSearchFlag = false;
            }
        } catch (error) {
            console.log('error in handle Key Change :', error);
        }
    }
  
    handelonchange(event) {
        this.replacetext = event.target.value;
        //console.log('replacetext', JSON.stringify(replacetext));
    }
  
    // onClick Replace
    async handleReplace() {
        if (this.isSearchFlag && (this.replacetext != '' || this.replacetext == null)) {
            this.isSearchFlag = false;
            let data_to_replace = this.allData;
            console.log('this.replacetext:', this.replacetext);
            console.log('this.fieldType:', this.fieldType);
            data_to_replace.forEach(async element => {
                await updateRecords({
                    strObjectApiName: this.SFDCobjectApiName,
                    Record_Id: element.Id,
                    Replace_text: this.replacetext,
                    Replace_field: this.fieldOption,
                    field_type: this.fieldType
                })
                    .then(result => {
                        console.log('result:', result);
                        if (result == 'Success') {
                            const evt = new ShowToastEvent({
                                title: 'Success',
                                message: 'Rename Sucessful',
                                variant: 'success',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(evt);
                        } else {
                            const evt = new ShowToastEvent({
                                title: 'Error',
                                message: result,
                                variant: 'error',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(evt);
                        }
                    }).then(async _ => {
                        this.replacetext = [];
                        this.searchKey = '';
                        this.FieldsValue = this.fieldOptionJSON[0].value;
                        this.getUpdatedData();
                    })
                    .catch((error) => {
                        this.error = reduceErrors(error);
                        console.log(' this.error:', this.error);
                        const evt = new ShowToastEvent({
                            title: 'Error',
                            message: 'Error while replace data' + this.error,
                            variant: 'error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(evt);
                    });
                //getRecordNotifyChange([{ recordId: element.Id }]);
            })
        }
        else {
            let evt = new ShowToastEvent({
                title: 'Warning',
                message: 'Search and Replace text should not be empty',
                variant: 'warning',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
    }

    searchDataTable() {
        let searchString = this.searchKey;
        let allRecords = this.allDataOrgCopy;
        let searchResults = [];
        let fieldDataType = this.fieldType; //
        if (fieldDataType == 'double' || fieldDataType == "double") {
            searchResults = allRecords.filter(key => key[this.fieldOption] == parseInt(searchString));
        } else if (fieldDataType == 'date' || fieldDataType == "date") {
            searchResults = allRecords.filter(key => {
                if (String(key[this.fieldOption]).toLocaleLowerCase().indexOf(String(searchString).toLocaleLowerCase()) != -1) {
                    return true;
                }
            });
        } else {
            searchResults = allRecords.filter(key => {
                if (String(key[this.fieldOption]).toLocaleLowerCase().indexOf(String(searchString).toLocaleLowerCase()) != -1) {
                    return true;
                }
            });
        }
        this.allData = searchResults;
    }
 
    filterCriteriaChange(event) {
        var filterCriteriaList = (JSON.parse(JSON.stringify(event.detail)));
        console.table(JSON.parse(JSON.stringify(filterCriteriaList)));
        var allRecords = [];
        allRecords = this.allData;
        var filterResults = [];
        if (filterCriteriaList.length == 0) {
            this.allData = this.allDataOrgCopy;
            allRecords = this.allDataOrgCopy;
        }
        if (this.takeActionConVal == 'AND') {
            filterCriteriaList.forEach(filterCriteria => {
                switch (filterCriteria.operator) {
                    case 'lessThan':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] < filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'greaterThan':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] > filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'lessOrEqual':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] <= filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'greaterOrEqual':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] >= filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'equals':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] == filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'notEquals':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] != filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'endsWith':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => String(key[filterCriteria.resource]).toLocaleLowerCase().endsWith(String(filterCriteria.value).toLocaleLowerCase()));
                        this.allData = filterResults;
                        break;
                    case 'startsWith':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => String(key[filterCriteria.resource]).toLocaleLowerCase().startsWith(String(filterCriteria.value).toLocaleLowerCase()));
                        this.allData = filterResults;
                        break;
                    case 'empty':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            if (key[filterCriteria.resource] == 'undefined' ||
                                key[filterCriteria.resource] == null ||
                                key[filterCriteria.resource] == '' ||
                                key[filterCriteria.resource].length <= 0) {
                                return true;
                            }
                        });
                        this.allData = filterResults;
                        break;
                    case 'contains':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            if (String(key[filterCriteria.resource]).toLocaleLowerCase().indexOf(String(filterCriteria.value).toLocaleLowerCase()) != -1) {
                                return true;
                            }
                        });
                        this.allData = filterResults;
                        break;
                    default:
                        break;
                }
            });
        } else if (this.takeActionConVal == 'OR') {
            var collectorData = [];
            allRecords = this.allDataOrgCopy;
            filterCriteriaList.forEach(filterCriteria => {
                switch (filterCriteria.operator) {
                    case 'lessThan':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] < filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'greaterThan':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] > filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'lessOrEqual':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] <= filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'greaterOrEqual':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] >= filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'equals':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] == filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'notEquals':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] != filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'endsWith':
                        filterResults = allRecords.filter(key => String(key[filterCriteria.resource]).toLocaleLowerCase().endsWith(String(filterCriteria.value).toLocaleLowerCase()));
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'startsWith':
                        filterResults = allRecords.filter(key => String(key[filterCriteria.resource]).toLocaleLowerCase().startsWith(String(filterCriteria.value).toLocaleLowerCase()));
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'empty':
                        filterResults = allRecords.filter(key => {
                            if (key[filterCriteria.resource] == 'undefined' ||
                                key[filterCriteria.resource] == null ||
                                key[filterCriteria.resource] == '' ||
                                key[filterCriteria.resource].length <= 0) {
                                return true;
                            }
                        });
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'contains':
                        filterResults = allRecords.filter(key => {
                            if (String(key[filterCriteria.resource]).toLocaleLowerCase().indexOf(String(filterCriteria.value).toLocaleLowerCase()) != -1) {
                                return true;
                            }
                        });
                        filterResults.forEach(vv => {
                            collectorData.push(vv);
                        });
                        console.log('collectorData:', JSON.stringify(collectorData));
                        break;
                    default:
                        break;
                }
                // duplicate removal logic 
                const uniqueSet = new Set(collectorData);
                this.allData = [...uniqueSet];
                console.log('this.allData OR:', JSON.parse(JSON.stringify(this.allData)));
            });
        }
    }
 
    takeactionChnage(event) {
        this.takeActionConVal = JSON.parse(JSON.stringify(event.detail));
        console.log('takeActionConVal:', this.takeActionConVal);
    }
  
    handleCancel(e) {
        this.draftValues = [];
        this.allData = this.allDataOrgCopy;
    }

    loadMoreData(event) {
        //console.log('Loadmore fired');
        if (this.isInfinScroll) {
            const { target } = event;
            target.isLoading = true;
            this.offset = parseInt(this.offset) + parseInt(this.NumberRows);
            this.loadData()
                .then(() => {
                    target.isLoading = false;
                });
        }
    }
 
    loadData() {
        return getUpdatedDataOnly({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName,
            offset: parseInt(this.offset)
        })
            .then(async data => {
                this.isLoading = true;
                let objStr = JSON.parse(data);
                let listOfRecords = JSON.parse(Object.values(objStr)[0]);
                let xx = JSON.stringify(listOfRecords);
                let recs = JSON.parse(xx);
                let newRecord = [...this.allData, ...recs];
                this.allData = newRecord;
                this.allDataOrgCopy = newRecord;
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('calling from Load Data', this.error);
            });
    }

 
    /*setPaginationType() {
        if (this.PaginationType == 'Infinite_Scroll') {
            this.isStdPagination = false;
            this.isInfinScroll = true;
        } else if (this.PaginationType == 'Statndard_Pagination') {
            this.isStdPagination = true;
            this.isInfinScroll = false;
        }
 
    }*/


    handleRowSelection(event) {
        let rowIds = [];
        let selectedRows = event.detail.selectedRows;
        selectedRows.forEach(element => rowIds.push(element.Id));
        console.log('selected row Ids', JSON.stringify(rowIds));
        this.rowIds = rowIds;
    }

  
    deleteRecordBtn(event) {
        deleteRecords({ idlist: this.rowIds })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })
                );
            })
            .then(_ => {
                this.rowIds = [];
                this.getUpdatedData();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}