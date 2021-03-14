import DIDResolver from './resolver.svelte';

export default {
	title: 'DIDResolver',
	component: DIDResolver,
	argTypes: {
		name: { control: 'text' },
		textColor: { control: 'color' },
	},
};

const Template = ({ ...args }) => ({
	Component: DIDResolver,
	props: args,
});

export const Default = Template.bind({});
Default.args = {};