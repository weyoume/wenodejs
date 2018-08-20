import 'mocha'
import * as assert from 'assert'

import {Asset, Price, getESCORPriceinECO} from './../src/index-node'

describe('asset', function() {

    it('should create from string', function() {
        const oneECO = Asset.fromString('1.000 ECO')
        assert.equal(oneECO.amount, 1)
        assert.equal(oneECO.symbol, 'ECO')
        const ESCOR = Asset.fromString('0.123456 ESCOR')
        assert.equal(ESCOR.amount, 0.123456)
        assert.equal(ESCOR.symbol, 'ESCOR')
        const EUSD = Asset.from('0.444 EUSD')
        assert.equal(EUSD.amount, 0.444)
        assert.equal(EUSD.symbol, 'EUSD')
    })

    it('should convert to string', function() {
        const ECO = new Asset(44.999999, 'ECO')
        assert.equal(ECO.toString(), '45.000 ECO')
        const ESCOR = new Asset(44.999999, 'ESCOR')
        assert.equal(ESCOR.toString(), '44.999999 ESCOR')
    })

    it('should add and subtract', function() {
        const a = new Asset(44.999, 'ECO')
        assert.equal(a.subtract(1.999).toString(), '43.000 ECO')
        assert.equal(a.add(0.001).toString(), '45.000 ECO')
        assert.equal(Asset.from('1.999 ECO').subtract(a).toString(), '-43.000 ECO')
        assert.equal(Asset.from(a).subtract(a).toString(), '0.000 ECO')
        assert.equal(Asset.from('99.999999 ESCOR').add('0.000001 ESCOR').toString(), '100.000000 ESCOR')
        assert.throws(() => Asset.fromString('100.000 ECO').subtract('100.000000 ESCOR'))
        assert.throws(() => Asset.from(100, 'ESCOR').add(a))
        assert.throws(() => Asset.from(100).add('1.000000 ESCOR'))
    })

    it('should max and min', function() {
        const a = Asset.from(1), b = Asset.from(2)
        assert.equal(Asset.min(a, b), a)
        assert.equal(Asset.min(b, a), a)
        assert.equal(Asset.max(a, b), b)
        assert.equal(Asset.max(b, a), b)
    })

    it('should throw on invalid values', function() {
        assert.throws(() => Asset.fromString('1.000 SNACKS'))
        assert.throws(() => Asset.fromString('I LIKE TURT 0.42'))
        assert.throws(() => Asset.fromString('Infinity ECO'))
        assert.throws(() => Asset.fromString('..0 ECO'))
        assert.throws(() => Asset.from('..0 ECO'))
        assert.throws(() => Asset.from(NaN))
        assert.throws(() => Asset.from(false as any))
        assert.throws(() => Asset.from(Infinity))
        assert.throws(() => Asset.from({bar:22} as any))
    })

    it('should parse price', function() {
        const price1 = new Price(Asset.from('1.000 ECO'), Asset.from(1, 'EUSD'))
        const price2 = Price.from(price1)
        const price3 = Price.from({base: '1.000 ECO', quote: price1.quote})
        assert.equal(price1.toString(), '1.000 ECO:1.000 EUSD')
        assert.equal(price2.base.toString(), price3.base.toString())
        assert.equal(price2.quote.toString(), price3.quote.toString())
    })

    it('should get eScore price', function() {
        const props: any = {
            totalECOfundForESCOR: '5.000 ECO',
            totalESCOR: '12345.000000 ESCOR',
        }
        const price1 = getESCORPriceinECO(props)
        assert.equal(price1.base.amount, 12345)
        assert.equal(price1.base.symbol, 'ESCOR')
        assert.equal(price1.quote.amount, 5)
        assert.equal(price1.quote.symbol, 'ECO')
        const badProps: any = {
            totalECOfundForESCOR: '0.000 ECO',
            totalESCOR: '0.000000 ESCOR',
        }
        const price2 = getESCORPriceinECO(badProps)
        assert.equal(price2.base.amount, 1)
        assert.equal(price2.base.symbol, 'ESCOR')
        assert.equal(price2.quote.amount, 1)
        assert.equal(price2.quote.symbol, 'ECO')
    })

    it('should convert price', function() {
        const price1 = new Price(Asset.from('0.500 ECO'), Asset.from('1.000 EUSD'))
        const v1 = price1.convert(Asset.from('1.000 ECO'))
        assert.equal(v1.amount, 2)
        assert.equal(v1.symbol, 'EUSD')
        const v2 = price1.convert(Asset.from('1.000 EUSD'))
        assert.equal(v2.amount, 0.5)
        assert.equal(v2.symbol, 'ECO')
        assert.throws(() => {
            price1.convert(Asset.from(1, 'ESCOR'))
        })
    })

})

