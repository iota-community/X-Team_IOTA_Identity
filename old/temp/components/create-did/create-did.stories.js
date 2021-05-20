import CreateDID from './create-did.svelte';

export default {
	title: 'CreateDID',
	component: CreateDID,
	argTypes: {
		name: { control: 'text' },
		textColor: { control: 'color' },
	},
};

const Template = ({ ...args }) => ({
	Component: CreateDID,
	props: args,
});

export const Default = Template.bind({});
Default.args = {};