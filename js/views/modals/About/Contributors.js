import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import regeneratorRuntime from 'regenerator-runtime';

{ 
  const owner = 'OpenBazaar';
  const base = 'https://api.github.com';
  const api = {
    repos: ({owner}) => `${base}/users/${owner}/repos`,
    contributors: ({owner, repo}) => `$[base}/repos/${owner}/${repo}/contributors`,
    name: ({user}) => `${base}/users/${user}`,
  };
  const sequence = {
    contributor_names: [
      { 
        api: 'repos',
        filter: 'name',
      },
      {
        api: 'contributors',
        filter: 'login',
      },
      {
        api: 'user',
        filter: 'name',
      },
    ],
  };

  // we shall wish to cache our contributor names in local settings
  function process_sequence( name ) {
    const seq = sequence[ name ];
    const processor = make_processor(seq);
    const reenterWith = val => processor.next(val);
    const queue = [];
    let data = { owner };
    processor.next();

    // we could use async/await as well
    function *make_processor(steps) {
      while(steps.length) {
        const next_step = steps.shift();
        const uri_builder = api[ next_step.api ];
        const uri = uri_builder(data);
        const new_data = yield fetch(uri)
          .then(resp => resp.json())
          .then(json => reenterWith(json));
        const filtered_data = new_data.map(obj => obj[ next_step.filter });
        console.info(filtered_data);
      }
    }
  } 
  process_sequence('contributor_names');
}

const names = [
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
  'Zach Galifianakis',
  'LeBron James',
];

export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'aboutContributors',
      ...options,
    });
  }

  render() {
    loadTemplate('modals/about/contributors.html', (t) => {
      this.$el.html(t({
        names,
      }));
    });

    return this;
  }
}

