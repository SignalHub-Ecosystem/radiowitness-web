# RadioWitness
Immutable, peer-to-peer archiving and distribution of police radio calls. Authors use [Software-Defined Radios](https://sdr.osmocom.org/trac/wiki/rtl-sdr) and [Dat Archives](https://datproject.org/) to record local police radio. Publishers seed archives from Authors and then re-distribute them to larger audiances. Other rolse arise too, such as Studios who synthesize radio archives into archives of audible speech, and Indexers who aggregate metadata on individual radio calls. Stop by [#radiowitness on freenode](https://webchat.freenode.net/) and say hi.

## Dependencies
Install [node & npm](https://nodejs.org/en/download/) then [rustc & cargo](https://www.rust-lang.org/en-US/install.html) as well. 

## Downloading
This software distribution is itself a Dat Archive, you can get a copy of it by opening [this link](dat://cda26788102ec1e166b72f2ed685f4dd1480c59189c03f23c253b822200fc152) in [Beaker Browser](https://beakerbrowser.com), or from the command line:
```
$ npm install -g dat
$ dat clone dat://cda26788102ec1e166b72f2ed685f4dd1480c59189c03f23c253b822200fc152 ./radiowitness
$ cd ./radiowitness
$ chmod +x ./bin/radiowitness
```

## Authoring & Publishing
The [Dat Protocol](https://www.datprotocol.com/) is transport agnostic, meaning Dat peers can communicate over TCP, UDP, any duplex stream really. This flexibility allows Publishers to provide any number of peering strategies to their Authors. In practice a TCP socket on a well-routed VPS is a fine start, add [WireGuard VPN](https://www.wireguard.com/) and you'll be feeling like the su of Nynex. Both Author and Publisher peers replicate via `stdin&stdout` so you've just gotta pipe them together using your transport of choice, in this example a linux fifo:
```
$ ./bin/radiowitness author install
$ echo "851162500,851287500,851137500" | ./bin/radiowitness search -d 0 -g 26
> searching 851162500Hz...
> searching 851287500Hz...
> channel found at 851287500Hz
$
$ ./bin/radiowitness author create --lat "30.245016" --lon="-97.788914" --wacn 781833 --sysid 318 --rfssid 1 --siteid 1
> dat://ba80c3ce100dcf0a70633e10ac6a89d5a55edc9531c1be0fdffc39986cca4178
$
$ ./bin/radiowitness publisher install
$ mkfifo /tmp/replication
$
$ ./bin/radiowitness author --radios 3 --mux 2 -s 1200000 -g 26 -f 851287500 < /tmp/replication | \
    ./bin/radiowitness publisher dat://ba80c3ce100dcf0a70633e10ac6a89d5a55edc9531c1be0fdffc39986cca4178 > /tmp/replication
```

## Audio Synthesis
Police radio is unlike the radio you hear from a car or boombox because it travels through the airwaves in a compressed form, all this means is that we've got to do an extra step to get something audible out of it. This extra step is intentionally left behind by both Author and Publisher peers because the *raw* radio archive has importance in and of itself. The Studio peer reads a radio archive as input and produces an audio archive as output:
```
$ ./bin/radiowitness studio install
$ ./bin/radiowitness studio dat://ba80c3ce100dcf0a70633e10ac6a89d5a55edc9531c1be0fdffc39986cca4178
> studio input  -> dat://ba80c3ce100dcf0a70633e10ac6a89d5a55edc9531c1be0fdffc39986cca4178
> studio output -> dat://e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968
> studio ready, restarting from 300.
$
$ ./bin/radiowitness play dat://e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968 | \
    play -t raw -b 16 -e signed -r 8k -c 1 -
```

## Audio Indexing
The archives created by Studios are basically giant, ever-growing [.WAV audio files](https://en.wikipedia.org/wiki/WAV) with a handful of extra metadata thrown in. Studio archives are great for streaming live, but to really explore years worth of audio some search indexes are needed. Indexing reads an audio archive as input and produces a [hyperdb](https://github.com/mafintosh/hyperdb) as output with calls batched by hours-since-unix-epoch at keys with the form `/calls/{epoch-hour}/{callid}`:
```
$ ./bin/radiowitness indexing install
$ ./bin/radiowitness indexing dat://e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968
> index input  -> dat://e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968
> index output -> dat://d54ab07c5daa1c51f4e39f5e35b67306821b8df9c8bdbc9b561b42b8d13eba49
> index ready, restarting from 120.
```

## Website
```
$ mkdir -p archive.web
$ ./bin/radiowitness web dat://author.key \
    --studio dat://studio.key --index dat://index.key > archive.web/dat.json
$ ln -f archive.web/dat.json web/dat.json
$ npm run build --prefix web/
$ cp -r web/dist/* archive.web/
$ dat sync archive.web
```

## Updates
This software distribution can be updated like any other Dat Archive by running the commands `dat sync` or `dat pull`. However, it is recommended that you use the `bin/radiowitness` bash script to check for updates. In addition to updating, the bash script will alert you to relevant release notes as long as someone wrote them ;).
```
$ ./bin/radiowitness update
```

## Standards & Conventions
Different peers author different types of data and so we need to introduce a little structure. All peer types operate on [hypercores](https://github.com/mafintosh/hypercore) with the exception of *Indexer* who's output is a [hyperdb](https://github.com/mafintosh/hyperdb). Hypercores are an append-only log structure and we use record `0` within the log as a sort of header. HyperDB is a magic P2P key-value store and we put a sort-of-header at key `/rw-about`.

### rw-author hypercore record `0`
```
{
  "version" : 1,
  "type" : "rw-author",
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-studio hypercore record `0`
Notice how `links` is used to reference the input hypercore:
```
{
  "version" : 1,
  "type" : "rw-studio",
  "links" : {
    "author" : [{ "type" : "rw-author", "href" : "dat://abc123" }]
  },
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-studio-index hyperdb key `/rw-about`
Notice how `links` is used to reference both the original radio hypercore and the audio hypercore produced by a `rw-studio` peer:
```
{
  "version" : 1,
  "type" : "rw-studio-index",
  "links" : {
    "author" : [{ "type" : "rw-author", "href" : "dat://abc123" }]
    "author" : [{ "type" : "rw-studio", "href" : "dat://def456" }]
  },
  "tags" : {
    "geo" : { "lat" : 4.20, "lon" : 6.66 },
    "network" : { "wacn" : 1, "sysid" : 1, "rfssid" : 1, "siteid" : 1 }
  }
}
```

### rw-publisher `dat.json`
The idea here is to build upon the existing Beaker Browser [dat.json spec](https://beakerbrowser.com/docs/apis/manifest) as much as possible. In this way Publishers can use a [Dat Website](https://beakerbrowser.com/docs/how-beaker-works/peer-to-peer-websites) as the front page of their P2P presence while seeding their Author's archives in a structured, discoverable way.
```
{
  "type" : ["website", "rw-publisher"],
  "title" : "Radio Venceremos",
  "description" : "we shall overcome",
  "web_root" : "/",
  "fallback_page" : "/assets/404.html",
  "links" : {
    "publisher" : [
      { "type" : "rw-author", "href" : 'dat://abc123' },
      { "type" : "rw-studio", "href" : 'dat://def456' },
      { "type" : "rw-studio-index", "href" : 'dat://ghi789' }
    ]
  }
}
```

## Development
Making this up as we go. Rebuild `web/` and generate root `.datignore` file by concatenating all `.gitignore` files found in subdirectories:
```
$ ./bin/radiowitness devstuff
```

## TCP Transport Example
publisher:
```
$ while true; do time ncat -l -p 6666 -c \
  "./bin/radiowitness publisher dat://ba80c3ce100dcf0a70633e10ac6a89d5a55edc9531c1be0fdffc39986cca4178"; \
  sleep 5; done
```

author:
```
$ while true; do time ncat cool.pub.peer 6666 -c \
  "./bin/radiowitness author --radios 3 --mux 2 -s 1200000 -g 26 -f 851287500" 2>> /tmp/rw-author.log; \
  sleep 5; done;
```

## Http Tuning
```
$ while true; do \
    rm -rf /tmp/rw-*; echo 851287500 | \
      node lib/js/rw-peer/index.js search --period 5000 -d 0 -g 26 | \
        ./bin/radiowitness http -p 8080;
    sleep 5; \
  done;
```

## License
License Zero Reciprocal Public License 2.0.1
