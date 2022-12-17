import { describe, test, expect } from '@jest/globals';
import Dex, { Entry, Flags, Tag } from '../../src/objects/dex';

describe("class Dex implements TDex", () => {

  const testTag = "test-tag";
  const testTag2 = "test-tag-2";

  const expect_countsToEqual = (dex: Dex<any>, entries: number, tags: number) => {
    expect(dex.numberOfEntries).toStrictEqual(entries);
    expect(dex.numberOfTags).toStrictEqual(tags);
    expect(dex.length).toStrictEqual(entries);
    expect(dex.size).toStrictEqual(tags);
    expect(dex.entries.length).toStrictEqual(entries);
    expect(dex.tags.size).toStrictEqual(tags);
    expect(dex.hashes.size).toStrictEqual(entries);
  }

  const expect_tagIsEmpty = (dex: Dex<any>, tag: Tag) => {
    expect(dex.tags.has(tag)).toBeTruthy();
    expect(dex.count(tag)).toStrictEqual(0);
    expect(dex.values(tag)).toStrictEqual([]);
  }

  const expect_entryHasNoTags = (dex: Dex<any>, entry: Entry) => {
    const hash = Dex.hash(entry)!;

    expect(dex.hashes.has(hash)).toBeTruthy();
    expect(dex.tags.for(hash)).toStrictEqual([]);
    expect(dex.tags.for(hash).size).toStrictEqual(0);
  }

  const expect_entryToHaveTags = (dex: Dex<any>, entry: any, tags: Tag[]) => {
    const tagsForEntry = dex.tags.for(entry);
    expect(tagsForEntry.size).toStrictEqual(tags.length);
    tags.forEach(tag => expect(tagsForEntry).toContain(tag));
  }

  const expect_tagsToHaveEntries = (dex: Dex<any>, tag: Tag, entries: Entry[]) => {
    const hashesForTag = dex.values(tag).map(Dex.hash);
    expect(hashesForTag.length).toStrictEqual(entries.length);
    entries.map(Dex.hash).forEach(hash => expect(hashesForTag).toContain(hash));
  }

  describe("constructor(...)", () => {
    test("() => Empty Dex", () => {
      const dex = new Dex<string>();
      expect_countsToEqual(dex, 0, 0);

      const _1 = dex.select.not("strictly-without-this-tag");
      const _2 = dex.query("strictly-with-this-tag");
      const _2_1 = dex.query(Flags.First, "strictly-with-this-tag");
      const _3 = dex.select.not.or("not-this", "or-this");
      const _4 = dex.query(Flags.Chain, "without-this").select("with-this-though")
      const _4_1 = dex.query(Flags.Chain | Flags.Or, "this", "or-this").first("one-that-has-this")
      const _5 = dex.select.not(Flags.Chain, "without-this").and("with-this-though");
      const f_1 = dex.tags.for("eNTRY ID 1");
      const entries = dex.map.entries();
      const tags = dex.map.tags();
      const toObjects = dex.map.tags();
      const mapObject = dex.map();

      const object = {};
      dex.for.entries((entry, tags) => {
        // things
      });
    });
    describe("(Tag[...])", () => {
      test("([Tag]) => Dex with just one empty Tag", () => {
        const dex = new Dex<string>([testTag]);

        expect_countsToEqual(dex, 0, 1);
        expect_tagIsEmpty(dex, testTag);
      });
      test("([Tag, Tag]) => Dex with multiple empty Tags", () => {
        const dex = new Dex<string>([testTag, testTag2]);

        expect_countsToEqual(dex, 0, 2);
        expect_tagIsEmpty(dex, testTag);
        expect_tagIsEmpty(dex, testTag2);
      });
    });
    describe("([TEntry, ...Tag[]][])", () => {
      test("([TEntry, Tag]) => Dex with one item with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([entry, testTag]);

        expect_countsToEqual(dex, 1, 1);
        expect_entryToHaveTags(dex, entry, [testTag]);
        expect_tagsToHaveEntries(dex, testTag, [entry]);
      });
      test("([TEntry, Tag, Tag]) => Dex with one item with multiple tags", () => {
        const entry = {};
        const dex = new Dex<{}>([entry, testTag, testTag2]);

        expect_countsToEqual(dex, 1, 2);
        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry]);
      });
      test("([TEntry, Tag], [TEntry, Tag]) => Dex with muiliple item with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([entry, testTag], [entry2, testTag2]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry2]);
      });
      test("([TEntry, Tag], [TEntry, Tag, Tag]) => Dex with muiliple item with one tag or multiple tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([entry, testTag], [entry2, testTag, testTag2]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry2]);
      });
      test("([TEntry, Tag, Tag], [TEntry, Tag, Tag]) => Dex with multiple items with multiple tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([entry, testTag, testTag2], [entry2, testTag, testTag2]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_entryToHaveTags(dex, entry2, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
      });
      test("([[TEntry, Tag]]) => Dex with one item with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([[entry, testTag]]);

        expect_countsToEqual(dex, 1, 1);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
      });
      test("([[TEntry, Tag, Tag]]) => Dex with one item with multiple tags", () => {
        const entry = {};
        const dex = new Dex<{}>([[entry, testTag, testTag2]]);

        expect_countsToEqual(dex, 1, 2);
        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry]);
      });
      test("([[TEntry, Tag], [TEntry, Tag]]) => Dex with muiliple item with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([[entry, testTag], [entry2, testTag2]]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry2]);
      });
      test("([[TEntry, Tag], [TEntry, Tag, Tag]]) => Dex with muiliple item with one tag or multiple tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([[entry, testTag], [entry2, testTag, testTag2]]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry2]);
      });
      test("([[TEntry, Tag, Tag], [TEntry, Tag, Tag]]) => Dex with multiple items with multiple tags", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([[entry, testTag, testTag2], [entry2, testTag, testTag2]]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_entryToHaveTags(dex, entry2, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
      });
    });
    describe("([TEntry, Tag[]][])", () => {
      test("([TEntry, [Tag]]) => Dex with one item with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([entry, [testTag]]);

        expect_countsToEqual(dex, 1, 1);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
      });
      test("([TEntry, [Tag, Tag]]) => Dex with one item with multiple tags", () => {
        const entry = {};
        const dex = new Dex<{}>([entry, [testTag, testTag2]]);

        expect_countsToEqual(dex, 1, 2);

        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry]);
      });
      test("([[TEntry, [Tag]]]) => Dex with one item with one tag", () => {
        const entry = {};
        const dex = new Dex<{}>([[entry, [testTag]]]);

        expect_countsToEqual(dex, 1, 1);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
      });
      test("([[TEntry, [Tag, Tag]]]) => Dex with one item with multiple tags", () => {
        const entry = {};
        const dex = new Dex<{}>([[entry, [testTag, testTag2]]]);

        expect_countsToEqual(dex, 1, 2);

        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag2, [entry]);
      });
      test("([[TEntry1, [Tag1]], [TEntry1, [Tag2]]]) => Dex with one item with multiple tags, split into multiple array items", () => {
        const entry = {};
        const dex = new Dex<{}>([[entry, [testTag], [entry, [testTag2]]]]);

        expect_countsToEqual(dex, 1, 2);

        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry]);
      });
      test("([TEntry1, [Tag]], [TEntry2, [Tag]]) => Dex with multiple items with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([entry, [testTag]], [entry2, [testTag]]);

        expect_countsToEqual(dex, 2, 1);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
      });
      test("([TEntry, [Tag, Tag]], [TEntry, [Tag, Tag]]) => Dex with multiple items with multiple tags each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([entry, [testTag, testTag2]], [entry2, [testTag, testTag2]]);

        expect_countsToEqual(dex, 2, 2);

        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_entryToHaveTags(dex, entry, [testTag2, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
      });
      test("([[TEntry, [Tag]], [TEntry, [Tag]]]) => Dex with multiple items with one tag each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([[entry, [testTag]], [entry2, [testTag2]]]);

        expect_countsToEqual(dex, 2, 2);
        expect_entryToHaveTags(dex, entry, [testTag])
        expect_entryToHaveTags(dex, entry2, [testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry]);
        expect_tagsToHaveEntries(dex, testTag2, [entry2]);
      });
      test("([[TEntry, [Tag, Tag]], [TEntry, [Tag, Tag]]]) => Dex with multiple items with multiple tags each", () => {
        const entry = {};
        const entry2 = {};
        const dex = new Dex<{}>([[entry, [testTag, testTag2]], [entry2, [testTag, testTag2]]]);

        expect_countsToEqual(dex, 2, 2);

        expect_entryToHaveTags(dex, entry, [testTag, testTag2])
        expect_entryToHaveTags(dex, entry2, [testTag, testTag2])
        expect_tagsToHaveEntries(dex, testTag, [entry, entry2]);
        expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
      });
    });
    describe("({...})", () => {
      describe("...{entry: TEntry}[]", () => {
        test("({entry: TEntry}) => Dex with only one entry with NO tags", () => {
          const entry = {};
          const dex = new Dex<{}>({ entry });

          expect_countsToEqual(dex, 1, 0);
          expect_entryHasNoTags(dex, entry);
        });
        test("({entry: TEntry}, {entry: TEntry}) => Dex with multiple entries with NO tags", () => {
          const entry = {};
          const entry2 = {};
          const dex = new Dex<{}>({ entry }, { entry: entry2 });

          expect_countsToEqual(dex, 2, 0);
          expect_entryHasNoTags(dex, entry);
          expect_entryHasNoTags(dex, entry2);
        });
      });
      describe("{entry: TEntry}[]", () => {
        test("([{entry: TEntry}]) => Dex with only entries with NO tags", () => {
          const entry = {};
          const dex = new Dex<{}>([{ entry }]);

          expect_countsToEqual(dex, 1, 0);
          expect_entryHasNoTags(dex, entry);
        });
        test("([{entry: TEntry}, {entry: TEntry}]) => Dex with only entries with NO tags", () => {
          const entry = {};
          const entry2 = {};
          const dex = new Dex<{}>([{entry}, {entry: entry2}]);

          expect_countsToEqual(dex, 2, 0);
          expect_entryHasNoTags(dex, entry);
          expect_entryHasNoTags(dex, entry2);
        });
      });
      describe("...{entry: TEntry, tag: Tag}[]", () => {
        test("({entry: TEntry, tag: Tag}) => Dex with only one entry with one tag", () => {
          const entry = {};
          const dex = new Dex<{}>([{ entry, tag: testTag }]);

          expect_countsToEqual(dex, 1, 0);
          expect_tagsToHaveEntries(dex, testTag, [entry]);
          expect_entryToHaveTags(dex, entry, [testTag]);
        });
        test("({entry: TEntry, tag: Tag}, {entry: TEntry, tag: Tag}) => Dex with multiple entries with one tag each", () => {
          const entry = {};
          const entry2 = {};
          const dex = new Dex<{}>({ entry, tag: testTag}, {entry: entry2, tag: testTag2});

          expect_countsToEqual(dex, 2, 0);
          expect_entryHasNoTags(dex, entry);
          expect_entryHasNoTags(dex, entry2);
        });
      });
      describe("{entry: TEntry, tag: Tag}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("{entry: TEntry, tags: Tag}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("...{entry: TEntry, tags: Tag}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("{entry: TEntry, tags: Tag[]}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("...{entry: TEntry, tags: Tag[]}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("{entry: TEntry, tags: Set<Tag>}[]", () => {
        // TODO: implement all similar to above 
      });
      describe("...{entry: TEntry, tags: Set<Tag>}[]", () => {
        // TODO: implement all similar to above 
      });
    });
    test("(Map<TEntry, Tag[]>) => Dex made of Map Entries", () => {
      const entry = {};
      const entry2 = {};
      const map = new Map<{}, Tag[]>();
      
      map.set(entry, [testTag]);
      map.set(entry2, [testTag, testTag2]);

      const dex = new Dex<{}>(map);

      expect_countsToEqual(dex, 2, 2);
      expect_entryToHaveTags(dex, entry, [testTag]);
      expect_entryToHaveTags(dex, entry2, [testTag, testTag2]);
      expect_tagsToHaveEntries(dex, testTag, [entry]);
      expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
    test("(Map<TEntry, Set<Tag>) => Dex made of Map Entries", () => {
      const entry = {};
      const entry2 = {};
      const map = new Map<{}, Set<Tag>>();
      
      map.set(entry, new Set([testTag2]));
      map.set(entry2, new Set([testTag2]));

      const dex = new Dex<{}>(map);

      expect_countsToEqual(dex, 2, 1);
      expect_entryToHaveTags(dex, entry, [testTag2]);
      expect_entryToHaveTags(dex, entry2, [testTag2]);
      expect_tagsToHaveEntries(dex, testTag2, [entry, entry2]);
    });
  });
});