<template>
<v-card>
    <v-container fluid class="pa-1">
        <v-layout row>
            <v-text-field v-model="filter.name" :readonly="!editable" :rules="[rules.required]" label="Filter Name"></v-text-field>
            <v-select v-if="editable" :items="types" v-model="filter.type" return-object item-text="name" item-avatar="icon" label="Type">
                <template v-slot:selection="{ item, index }">
                    <v-icon class="mr-1">{{item.icon}}</v-icon> {{item.name}}
                </template>
                <template slot="item" slot-scope="data">
                    <v-icon class="mr-1">{{data.item.icon}}</v-icon> {{data.item.name}}
                </template>
            </v-select>
        </v-layout>
        <v-textarea :error-messages="validationText" class="mb-1 pa-0" :readonly="!editable" v-model="filter.text" box color="success" no-resize :label="getTextLabel" rows="15"></v-textarea>
        <v-layout row v-if="editable" align-center justify-center>
            <v-text-field class="ma-0 pa-0" label="enter your sample input line here" :messages="testMessage" box v-model="filter.sample"></v-text-field>
            <v-btn small outline class="ma-0 pa-0" @click="Validate">Validate</v-btn>
        </v-layout>
    </v-container>
</v-card>
</template>

<script>
export default {
    props: ['filter', 'types', 'editable'],
    data: () => ({
        name: 'js-text-filter',
        rules: {
            length: len => v => (v || '').length >= len || `Invalid character length, required ${len}`,
            required: v => !!v || 'This field is required'
        },
        selectedType: null,
        validationText: "",
        testMessage: ""
    }),
    mounted() {
        //console.log(this.types)
        if (this.filter) {
            this.selectedType = this.types.find(x => {
                return x.name == this.filter.type
            })
            //console.log(this.selectedType)
        }

    },
    watch: {
        'filter.name': {
            handler: function (val) {
                this.Validate()
            },
            deep: true
        },
        'filter.type': {
            handler: function (val) {
                this.Validate()
            },
            deep: true
        },
        'filter.text': {
            handler: function (val) {
                this.Validate()
            },
            deep: true
        }
    },
    methods: {

        Validate() {
            this.filter.valid = false
            this.validationText = []
            this.testMessage = []
            if (this.filter.name.length <= 0) {
                this.validationText = "please enter filter name"
                return
            }
            if (!this.filter.type) {
                this.validationText = "please select filter type"
                return
            }
            if (this.filter.text.length <= 0) {
                this.validationText = "please enter filter code"
                return
            }
            try {
                let f = new Function('line', this.filter.text);
                let res = f(this.filter.sample)
                this.filter.valid = true
                this.testMessage = "OK, the result is: " + JSON.stringify(res)
                setTimeout(() => this.testMessage = [], 2000)
            } catch (e) {
                this.validationText = "failed compiling your code: [" + e.message + ']'
                //console.error(e)
            }

        }

    },
    computed: {
        getTextLabel() {
            //console.log(this.selectedType)
            if (this.filter.type) {
                return this.filter.type.desc
            }
            return 'select a filter type'

        },
    }
}
</script>
