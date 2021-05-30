import CreateVC from './create-vc.svelte';

export default {
	title: 'CreateVC',
	component: CreateVC,
	argTypes: {
		name: { control: 'text' },
		textColor: { control: 'color' },
	},
};

const Template = ({ ...args }) => ({
	Component: CreateVC,
	props: args,
});

export const Default = Template.bind({});
Default.args = {};