const REQUEST_URL =
  'https://vv-agency-anthill-dam.veevavault.com/ui/binders/section';
const BINDER_ID_PARAM_NAME = 'documentId';

chrome.devtools.network.onRequestFinished.addListener((event) => {
  if (event?.request?.url === REQUEST_URL) {
    event.getContent((body) => {
      const {
        payload: { itemsInChunk },
      } = JSON.parse(body);
      const binderId = getBinderId(
        event.request?.postData?.params,
        itemsInChunk
      );
      const defaultResult = {
        presentationJSON: {
          id: withVersion(binderId),
          nodes: [],
        },
        slideMap: {},
      };

      const data = itemsInChunk.reduce((acc, { docId, name }) => {
        acc.slideMap[name] = {
          id: docId,
          sequenceName: name,
        };
        acc.presentationJSON.nodes.push({ id: withVersion(docId) });
        return acc;
      }, defaultResult);

      hideLoading();
      initControls(data);
    });
  }
});

function getBinderId(requestParams, chunks) {
  return (
    chunks?.[0]?.binderId ||
    requestParams?.find(({ name }) => name === BINDER_ID_PARAM_NAME)?.value ||
    'NOT_FOUND'
  );
}

function withVersion(value) {
  return `${value}_0_1`;
}

function initControls(data) {
  const controls = document.getElementById('controls');
  controls.classList.remove('hidden');
  controls.addEventListener('click', (event) => {
    const handlersMap = {
      slideMapBtn: ({ slideMap }) => copyToClipboard(JSON.stringify(slideMap)),
      presentationJsonBtn: ({ presentationJSON }) => copyToClipboard(JSON.stringify(presentationJSON)),
    };

    if (!handlersMap?.[event.target.id]) {
      console.log('Handler not found!!!');
      return;
    }

    handlersMap[event.target.id](data);
  });
}

function copyToClipboard(value) {
  const textarea = document.createElement('textarea');
  textarea.textContent = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function hideLoading() {
  document.getElementById('loader').classList.add('hidden');
}
