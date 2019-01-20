import { h } from 'preact';
import template from './Home.pug';

const Home = () => {
	const message = 'This is the Home component.';

	return template({
        // variables
        message,
    });
};

export default Home;
