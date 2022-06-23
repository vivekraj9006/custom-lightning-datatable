import { LightningElement, api, track } from 'lwc';
const areSame = (obj1, obj2) => obj1 === obj2;

export default class Picklist extends LightningElement {

    @api label;
    @api placeholder;
    @api options;
    @api value;
    @api context; // nothing but account ID , object ID
    @api apiname;

    @api dependentoption;
    @api dependentvalue;
    @api parentapi;
    @track disp_Opt = [];

    @api isdependentflag;
    @api childlabel;

    childAPI = this.childlabel; // used for ppassing API value
    C_LABEL; // for CHILD Lable on UI

    tempObj = { label: 'None', value: 'None' };
  
    connectedCallback() {

        console.log('childlabel with __c:', this.childlabel);
        var newChildLable = this.childlabel;
        newChildLable = newChildLable.replace('__c', '');
        this.C_LABEL = newChildLable.replace('_', ' ');
        console.log(' this.C_LABEL: without _ ', this.C_LABEL);

        if (this.value === undefined) {
            this.tempObj.isSelected = true;
        } else {
            this.tempObj.isSelected = false;
        }

        this.options = this.options.map(option =>
            Object.assign({}, option, { isSelected: areSame(option.value, this.value) }));
        this.options.unshift(this.tempObj);

        if (this.isdependentflag) {
            if (this.value === undefined) {
                this.tempObj.isSelected = true;
                this.disp_Opt.push(this.tempObj);
            } else {
                this.disp_Opt = this.dependentoption[this.parentapi][this.value];
            }
        }
    }

 
    handleChange(event) {
        //show the selected value on UI
        this.value = event.target.value;
        let apiname = JSON.parse(JSON.stringify(this.apiname));

        if (this.value === 'None') {
            this.disp_Opt = [];
            this.tempObj.isSelected = true;
            this.disp_Opt.push(this.tempObj);
            this.dependentvalue = 'None';
        } else {
            this.disp_Opt = this.dependentoption[this.parentapi][this.value];
            this.dependentvalue = this.disp_Opt[0];
            console.log("Dpend Value from datatable is 3  " + JSON.stringify(this.dependentvalue));
            console.log('Context in dependent : ', this.context);
            console.log('api in dependent : ', this.childlabel);
            this.dispatchChnageValues(this.context, this.dependentvalue, this.childlabel);
        }

        this.dispatchChnageValues(this.context, this.value, apiname);
    }

    handleChangeDependent(event) {
        //show the selected value on UI
        this.dependentvalue = event.target.value;
        this.dispatchChnageValues(this.context, this.dependentvalue, this.childlabel);
        console.log("Dpend Value from datatable is 2  " + JSON.stringify(this.dependentvalue));
        console.log('Context in dependent 2 : ', this.context);
        console.log('api in dependent  2 : ', this.childlabel);
    }

    dispatchChnageValues(context, value, apiname) {
        //fire event to send context and selected value to the data table
        const pickListChangeEvent = new CustomEvent('picklistchanged', {
            composed: true,
            bubbles: true,
            cancellable: true,
            detail: {
                data: {
                    context: context,
                    value: value,
                    apiname: apiname
                }
            }
        });
        this.dispatchEvent(pickListChangeEvent);
    }

}