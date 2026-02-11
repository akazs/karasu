/**
 * Group and member definitions for all supported idol groups.
 * Pure data module -- no Svelte dependencies.
 */

export const DEFAULT_GROUP_ID = 'sakurazaka';

const sakurazakaGenerations = [
  {
    name: '二期生',
    members: [
      { fullname: '井上 梨名', shortname: '井上' },
      { fullname: '遠藤 光莉', shortname: '光莉' },
      { fullname: '大園 玲', shortname: '大園' },
      { fullname: '大沼 晶保', shortname: '大沼' },
      { fullname: '幸阪 茉里乃', shortname: '幸阪' },
      { fullname: '武元 唯衣', shortname: '武元' },
      { fullname: '田村 保乃', shortname: '田村' },
      { fullname: '藤吉 夏鈴', shortname: '藤吉' },
      { fullname: '増本 綺良', shortname: '増本' },
      { fullname: '松田 里奈', shortname: '松田' },
      { fullname: '森田 ひかる', shortname: '森田' },
      { fullname: '守屋 麗奈', shortname: '守屋' },
      { fullname: '山﨑 天', shortname: '山﨑' }
    ],
    enabled: true
  },
  {
    name: '三期生',
    members: [
      { fullname: '石森 璃花', shortname: '石森' },
      { fullname: '遠藤 理子', shortname: '理子' },
      { fullname: '小田倉 麗奈', shortname: '小田倉' },
      { fullname: '小島 凪紗', shortname: '小島' },
      { fullname: '谷口 愛季', shortname: '谷口' },
      { fullname: '中嶋 優月', shortname: '中嶋' },
      { fullname: '的野 美青', shortname: '的野' },
      { fullname: '向井 純葉', shortname: '向井' },
      { fullname: '村井 優', shortname: '村井' },
      { fullname: '村山 美羽', shortname: '村山' },
      { fullname: '山下 瞳月', shortname: '山下' }
    ],
    enabled: true
  },
  {
    name: '四期生',
    members: [
      { fullname: '浅井 恋乃未', shortname: '浅井' },
      { fullname: '稲熊 ひな', shortname: '稲熊' },
      { fullname: '勝又 春', shortname: '勝又' },
      { fullname: '佐藤 愛桜', shortname: '佐藤' },
      { fullname: '中川 智尋', shortname: '中川' },
      { fullname: '松本 和子', shortname: '松本' },
      { fullname: '目黒 陽色', shortname: '目黒' },
      { fullname: '山川 宇衣', shortname: '山川' },
      { fullname: '山田 桃実', shortname: '山田' }
    ],
    enabled: true
  }
];

const hinataGenerations = [
  {
    name: '二期生',
    members: [
      { fullname: '金村 美玖', shortname: '金村' },
      { fullname: '小坂 菜緒', shortname: '小坂' },
      { fullname: '松田 好花', shortname: '松田' }
    ],
    enabled: true
  },
  {
    name: '三期生',
    members: [
      { fullname: '上村 ひなの', shortname: '上村' },
      { fullname: '髙橋 未来虹', shortname: '髙橋' },
      { fullname: '森本 茉莉', shortname: '森本' },
      { fullname: '山口 陽世', shortname: '山口' }
    ],
    enabled: true
  },
  {
    name: '四期生',
    members: [
      { fullname: '石塚 瑶季', shortname: '石塚' },
      { fullname: '小西 夏菜実', shortname: '小西' },
      { fullname: '清水 理央', shortname: '清水' },
      { fullname: '正源司 陽子', shortname: '正源司' },
      { fullname: '竹内 希来里', shortname: '竹内' },
      { fullname: '平尾 帆夏', shortname: '平尾' },
      { fullname: '平岡 海月', shortname: '平岡' },
      { fullname: '藤嶌 果歩', shortname: '藤嶌' },
      { fullname: '宮地 すみれ', shortname: '宮地' },
      { fullname: '山下 葉留花', shortname: '山下' },
      { fullname: '渡辺 莉奈', shortname: '渡辺' }
    ],
    enabled: true
  },
  {
    name: '五期生',
    members: [
      { fullname: '大田 美月', shortname: '大田' },
      { fullname: '大野 愛実', shortname: '大野' },
      { fullname: '片山 紗希', shortname: '片山' },
      { fullname: '蔵盛 妃那乃', shortname: '蔵盛' },
      { fullname: '坂井 新奈', shortname: '坂井' },
      { fullname: '佐藤 優羽', shortname: '佐藤' },
      { fullname: '下田 衣珠季', shortname: '下田' },
      { fullname: '高井 俐香', shortname: '高井' },
      { fullname: '鶴崎 仁香', shortname: '鶴崎' },
      { fullname: '松尾 桜', shortname: '松尾' }
    ],
    enabled: true
  }
];

function deepFreeze(obj) {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

export const structured_groups = deepFreeze([
  {
    id: 'sakurazaka',
    name: '櫻坂46',
    generations: sakurazakaGenerations,
    enabled: true
  },
  {
    id: 'hinatazaka',
    name: '日向坂46',
    generations: hinataGenerations,
    enabled: true
  }
]);

/**
 * Find a group by its id.
 * @param {string} groupId
 * @returns {object|undefined}
 */
export function getGroupById(groupId) {
  return structured_groups.find((g) => g.id === groupId);
}

/**
 * Get all members across all groups, each annotated with their groupId.
 * @returns {Array<{groupId: string, fullname: string, shortname: string}>}
 */
export function getAllMembers() {
  const members = [];
  for (const group of structured_groups) {
    for (const gen of group.generations) {
      for (const member of gen.members) {
        members.push({
          groupId: group.id,
          fullname: member.fullname,
          shortname: member.shortname
        });
      }
    }
  }
  return members;
}

/**
 * Get all members for a specific group, each annotated with their groupId.
 * @param {string} groupId
 * @returns {Array<{groupId: string, fullname: string, shortname: string}>}
 */
export function getGroupMembers(groupId) {
  const group = getGroupById(groupId);
  if (!group) {
    return [];
  }
  const members = [];
  for (const gen of group.generations) {
    for (const member of gen.members) {
      members.push({
        groupId: group.id,
        fullname: member.fullname,
        shortname: member.shortname
      });
    }
  }
  return members;
}

/**
 * Create a composite key from groupId and fullname.
 * @param {string} groupId
 * @param {string} fullname
 * @returns {string}
 */
export function makeCompositeKey(groupId, fullname) {
  return `${groupId}:${fullname}`;
}

/**
 * Parse a composite key into groupId and fullname.
 * @param {string} key
 * @returns {{groupId: string, fullname: string}|null}
 */
export function parseCompositeKey(key) {
  if (!key || typeof key !== 'string') {
    return null;
  }
  const colonIndex = key.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }
  return {
    groupId: key.substring(0, colonIndex),
    fullname: key.substring(colonIndex + 1)
  };
}
