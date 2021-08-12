/**
 * @author            : Vrushabh Uprikar
 * @last modified on  : 27-07-2021
 * @last modified by  : Vrushabh Uprikar
**/
import { LightningElement, api } from 'lwc';
const areSame = (obj1, obj2) => obj1 === obj2;

export default class Picklist extends LightningElement
{

    @api label;
    @api placeholder;
    @api options;
    @api value;
    @api context; // nothing but account ID , object ID
    @api apiname;

    tempObj = {label:'None', value:'None'};

    connectedCallback()
    {
        if(this.value === undefined)
        {
            this.tempObj.isSelected = true;
        }else
        {
            this.tempObj.isSelected = false;
        }
        // console.log(JSON.stringify(this.tempObj));
        this.options = this.options.map(option =>
            Object.assign({}, option, {isSelected : areSame(option.value, this.value)}));
        this.options.unshift(this.tempObj);

       // console.log('Field api name : ', this.apiname);

        // console.log('options list ===> ',JSON.stringify(this.options));
    }

    handleChange(event) {
        //show the selected value on UI
        this.value = event.target.value;
        console.log("Value from datatable is "+this.value)
        console.log("Context of this value is : "+this.context);
        let apinm = JSON.parse(JSON.stringify(this.apiname));

        //fire event to send context and selected value to the data table
        const pickListChangeEvent = new CustomEvent('picklistchanged',{
            composed: true,
            bubbles: true,
            cancellable: true,
            detail: {
                data: {
                    context: this.context,
                    value: this.value,
                    apiname: apinm
                }
            }
        });
        this.dispatchEvent(pickListChangeEvent);
    }
}
