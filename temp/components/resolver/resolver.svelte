<svelte:options tag="did-resolver" />

<script context="module">
  import * as lib from "iota-identity-wasm-test/web/";
  let node;
  let nodes = [
    // Mainnet
    { network: "main", url: "https://nodes.thetangle.org:443" },
    { network: "main", url: "https://nodes.iota.org:443" },
    { network: "main", url: "https://iotanode.us:14267" },
    { network: "main", url: "https://gewirr.com:14267" },
    { network: "main", url: "https://hornet.beeiota.host:14265" },
    // Comnet
    { network: "com", url: "https://nodes.comnet.thetangle.org:443" },
    // Devnet
    { network: "dev", url: "https://nodes.devnet.iota.org:443" },
  ];
  let did = "did:iota:3tukwL7jMP5cfxtUB8je7wAUkaPSAgBMeGnY6YBivpHf";
  let network = "";
  let networkoption = "main";
  let resolveDID = "";
  let addressUrl = "https://explorer.iota.org/mainnet/";
  let visible = false;
  function visibility() {
    visible = !visible;
  }
  async function resolve_did() {
    await lib.init();
    //parse did to get the network
    let parsed_did = lib.DID.parse(did);
    console.log(parsed_did);
    switch (parsed_did.network) {
      case "main":
        network = "Mainnet";
        addressUrl =
          "https://explorer.iota.org/mainnet/address/" + parsed_did.address;
        break;
      case "com":
        network = "Comnet";
        addressUrl =
          "https://comnet.thetangle.org/address/" + parsed_did.address;
        break;
      case "dev":
        addressUrl =
          "https://explorer.iota.org/devnet/address/" + parsed_did.address;
        network = "Devnet";
    }
    let networkNodes = nodes.filter(
      (node) => node.network == parsed_did.network
    );
    let doc = "";
    for (let t = 0; t < 10; t++) {
      if (doc != "" && typeof doc != "undefined") {
        return doc;
      }
      doc = await lib
        .resolve(did, {
          nodes: networkNodes.map((node) => node.url),
          network: parsed_did.network,
        })
        .catch((e) => console.log(e));
    }
    return "No document found. Maybe the transaction was deleted on this node?";
  }
  function handleClick() {
    resolveDID = resolve_did();
  }
  function addNode() {
    nodes.push({ network: networkoption, url: node });
    visibility();
  }
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }
  pre {
    display: inline-block;
    text-align: left;
    max-width: 50em;
    width: 630px;
    word-wrap: break-word;
    /* overflow-wrap: break-word; */
  }
  h1 {
    color: #14262c;
    font-size: 4em;
    font-weight: 100;
  }
  input[type="text"] {
    width: 35em;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  <div>
    {#if !visible}<button on:click={visibility}>Add node</button>{/if}
    {#if visible}
      <div><input type="text" bind:value={node} placeholder="NodeURL" /></div>
      <div>
        <label>
          <input type="radio" bind:group={networkoption} value={'main'} />
          Mainnet
        </label>
        <label>
          <input type="radio" bind:group={networkoption} value={'com'} />
          Comnet
        </label>
        <label>
          <input type="radio" bind:group={networkoption} value={'dev'} />
          Devnet
        </label>
      </div>
      <button on:click={addNode}>Add node</button>
    {/if}
  </div>

  <input type="text" bind:value={did} placeholder="Enter a DID" />
  <button on:click={handleClick}>Resolve DID</button>
  <div>Network: {network}</div>
  <a href={addressUrl} target="_blank">Explorerlink</a>

  {#await resolveDID}
    <p>Resolving...</p>
  {:then resolved_doc}
    <p>Resolved document:</p>
    <pre>{JSON.stringify(resolved_doc, null, 1)}</pre>
  {:catch error}
    {console.log(error)}
    <p style="color: red">{error}</p>
  {/await}
</main>
