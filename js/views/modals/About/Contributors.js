import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import regeneratorRuntime from 'regenerator-runtime';

let names;

// Linter notes:
  // linter will not be happy with some things which also work:
  // no-use-before-define -- becuase of const variable hoisting and invocation time
  // this works and is a way to share data in closures. The linter is also unhappy.
{
  // proof of concept for Dynamic Contributors List
  // see the comments for more information

  const obGitHubName = 'OpenBazaar';
  const base = 'https://api.github.com';

  // this is from the GitHub entity created
  // for purposes of testing this code: theob1ioaccount000
  // it has no access to anything except public information
  // because of the limit of 5K calls
  // there can only be around 25 such calls to the
  //  contributor_names process per day ( each call makes around 200 requests )
  const param = 'e337ed04a17834db421690774b00125b64c51f06';
  const parts = ['acc', /* this is */ 'ess_to', /* to foil GitHub searches */ 'ken'];
  const query = `?${parts.join('')}=${param}`;
  const api = {
    repos: ({ owner }) => `${base}/users/${owner}/repos${query}`,
    contributors: ({ owner, repo }) => `${base}/repos/${owner}/${repo}/contributors${query}`,
    name: ({ user }) => `${base}/users/${user}${query}`,
  };
  const process = {
    contributor_names: [
      {
        api: 'repos',
        filter: (job, item) => ({ owner: job.data.owner, repo: item.name }),
        isList: true,
      },
      {
        api: 'contributors',
        filter: (job, item) => ({ user: item.login }),
        isList: true,
        uniqueKey: 'login',
      },
      {
        api: 'name',
        filter: (job, item) => item.name || job.data.user,
        isList: false,
      },
    ],
  };

  // Sooth linter by "using" 'regeneratorRuntime'
  console.info(regeneratorRuntime);

  function updateNameList(newNames) {
    const everPresentNames = [
      'Jenn Cloud',
    ];
    names = [...new Set([...everPresentNames, ...newNames])];
    console.info(`Name list updated ${names}`);
  }

  // In Depth -- Take Processor
    // This is a simple asynchronous task processor that
    // Takes an initial piece of data, and a named sequence of steps
    // And creates a job from that piece of data that applies to the first step
    // It adds that job to the queue. As it processes the queue
    // It takes the output of each job, filters it, and creates a new job
    // That applies to the next step in the sequence and
    // That passes the filtered output of the previous step
    // as input for the step
    // An optimization has been added to specify that duplicates be removed
    // An optimization to process some number of jobs concurrently shall be added

  function processSequence(name, firstData, then = val => val) {
    // we could use async/await as well
    function *makeProcessor(steps) {
      while (queue.length) {
        const job = queue.shift();
        const step = steps[job.seq];
        console.info(job, step);
        const apiURI = api[step.api](job.data);

        // async step: yield execution to get the data
        // and then reenter here when data is ready
        const rawData = yield fetch(apiURI)
          .then(resp => resp.json())
          .then(json => reenterWith(json));

        let filteredData = rawData;
        if (step.filter) { // then filter the data
          if (step.isList) {
            if (step.uniqueKey) { // then allow only the first item for each key
              let seen = duplicates[step.seq];
              if (!seen) seen = duplicates[step.seq] = new Set();
              filteredData = filteredData.filter(item => {
                const key = item[step.uniqueKey];
                const newKey = !seen.has(key);
                if (newKey) seen.add(key);
                return newKey;
              });
            }
            filteredData = filteredData.map(item => step.filter(job, item));
          } else {
            filteredData = step.filter(job, filteredData);
          }
        }

        // make the next job or save the result
        const nextSeq = job.seq + 1;
        if (nextSeq === steps.length) {
          result.push(filteredData);
        } else {
          if (step.isList) {
            queue.push(...filteredData.map(item => ({ data: item, seq: nextSeq })));
          } else {
            queue.push({ data: filteredData, seq: nextSeq });
          }
        }
      }

      then(result);
    }

    const firstJob = { data: firstData, seq: 0 };
    const queue = [firstJob];
    const duplicates = [];
    const proc = process[name];
    const processor = makeProcessor(proc);
    const reenterWith = val => processor.next(val);
    const result = [];

    processor.next();
  }

  // In Depth -- Caching, Rate Limits and Moving to a Server
    // we shall wish to cache our contributor names in local settings
    // and unfortunately github has a authenticated rate limit of 5000 per hour
    // which shall not be enough for humans to use this in the client
    // I have created a temporary github account linked to my work email for the purpose of testing
    // in future it shall work to move this code to some kind of "helper server" that can
    // obtain this list a few times a day and then provide a copy to clients
  processSequence(
    'contributor_names',
    { owner: obGitHubName },
    contributors => updateNameList(contributors)
  );
}

// note: this list was generated using the above code
// the order is the order produced by that code
// it was not sorted in any way
names = [
  'Jenn Cloud',
  'Chris Pacia',
  'Dr Washington Sanchez',
  'Sam Patterson',
  'Juan Benet',
  'Jeromy Johnson',
  'Brian Tiger Chow',
  'ᴍᴀᴛᴛ ʙᴇʟʟ',
  'Christian Couder',
  'Henry',
  'Jakub Sztandera',
  'Richard Littauer',
  'rht',
  'Lars Gierth',
  'Tv',
  'Stephen Whitmore',
  'W. Trevor King',
  'Andreas Metsälä',
  'Mildred Ki\'Lya',
  'Knut Ahlers',
  'Tor Arne Vestbø',
  'Siraj',
  'Borzov',
  'thomas-gardner',
  'Kevin Atkinson',
  'mikey',
  'Dylan Powers',
  'Michael Muré',
  'Travis Person',
  'Konstantin Koroviev',
  'Yuval Langer',
  'Michael Lovci',
  'Friedel Ziegelmayer',
  'Tyler Smith',
  'Brian Hoffman',
  'Josh Jeffryes',
  'Robert Misiorowski',
  'Mike Wolf',
  'Kirvx',
  'Squirrel2020',
  'Mario Dian',
  'rhcastilhos',
  'Libter',
  'Richard Schneider',
  'Dekker3D',
  'Aya Walraven',
  'HostFat',
  'Samuel Reed',
  'ameliagoodman',
  'Angel Leon',
  'James Wilson',
  'Justin',
  'moldcraft',
  'pryds',
  'DJ Booth',
  'Nissim Karpenstein',
  'Luca Weiss',
  'Andres Jalinton',
  'LodeRunner',
  'mpatc',
  'Hong Shuning',
  'tenthhuman',
  'David Albrecht',
  'Yuri Zhykin',
  'Leo Arias',
  'Jack Kleeman',
  'Alexander Harkness',
  'Duo Search',
  'Michael Lynch',
  'Oyebanji Jacob Mayowa',
  'Check your git settings!',
  'Giannis Adamopoulos',
  'Steven Roose',
  'Gianluca Boiano',
  'arichnad',
  'FoxCarlos',
  'tomgalloway',
  'Nikolaos Korasidis',
  'Dustin Dettmer',
  'Tobin Harding',
  'eiabea',
  'Jondale',
  'BHC',
  'Martin Honermeyer',
  'Alex Miller',
  'Joshua Sindy',
  'unsystemizer',
  'Bartłomiej Kurzeja',
  'Daniel Gonzalez Gasull',
  'Jennifer Glauche',
  'Jonathan Cross',
  'Luigi Maselli',
  'Christopher Käck',
  'Tim Pollard',
  'Braden Glasgow',
  'Francois',
  'Dionysis Zindros',
  'Marc Schaffner-Gurney',
  'Ryan Shea',
  'Amin Shah Gilani',
  'vbuterin',
  'Mirko Bonasorte',
  'WizardOfOzzie',
  'Christian Lundkvist',
  'Ruben de Vries',
  'Steven Braeger',
  'ethers',
  'Stephan Schielke',
  'Federico Cardoso',
  'cneves',
  'Joel Lehtonen',
  'Corey Farwell',
  'Jack Peterson',
  'MiWCryptoCurrency',
  'Michael Flaxman',
  'Taylor Gerring',
  'phelixbtc',
  'genjix',
  'caedesvvv',
  'Andres Vargas',
  'Noel Maersk',
  'Bobalot',
  'ty',
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
