const exportMediaWiki = require('./exportMediaWiki');

exports.expressCreateServer = function (hook_name, args, cb) {
  args.app.get('/p/:pad/:rev?/export/mediawiki', (req, res, next) => {
    const padID = req.params.pad;
    const revision = req.params.rev ? req.params.rev : null;

    exportMediaWiki.getPadMediaWikiDocument(padID, revision, (err, result) => {
      res.contentType('plain/text');
      res.send(result);
    });
  });
};
