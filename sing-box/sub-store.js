// 从 $arguments 中解构出 type 和 name 参数
const { type, name } = $arguments

// 定义一个兼容的出口对象，tag 为 'COMPATIBLE'，类型为 'direct'
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible  // 用于标记是否已经添加过兼容出口

// 解析文件中的配置 JSON
let config = JSON.parse($files[0])

// 根据传入的 type 和 name，生成代理列表
// 如果 type 匹配 /^1$|col/i 则设置为 'collection'，否则为 'subscription'
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 将生成的代理添加到配置的 outbounds 数组中
config.outbounds.push(...proxies)

// 遍历配置中的每个出口，根据出口 tag 添加对应的代理标签
config.outbounds.map(i => {
  if (['select'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?!.*SakuraCat).*$/i))
  }
  if (['tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*台湾)(?=.*(进阶IEPL|家宽)).*$/i))
  }
  if (['sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*新加坡)(?=.*进阶IEPL).*$/i))
  }
  if (['ai-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /澳洲|随机家庭/i))
  }
  if (['lower-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /x 0./i))
  }
})

// 检查每个出口的 outbounds 数组，如果为空则添加兼容出口
config.outbounds.forEach(outbound => {
  // 如果 outbound.outbounds 是数组且为空
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    // 如果还没有添加过兼容出口，则添加，并标记为已添加
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    // 将兼容出口的 tag 添加到当前出口的 outbounds 数组中
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// 将修改后的配置对象转换为格式化的 JSON 字符串
$content = JSON.stringify(config, null, 2)

/**
 * 根据传入的代理数组和可选的正则表达式，返回所有匹配的代理标签数组
 * @param {Array} proxies - 代理对象数组
 * @param {RegExp} [regex] - 用于匹配代理 tag 的正则表达式
 * @returns {Array} 匹配的代理标签数组
 */
function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
