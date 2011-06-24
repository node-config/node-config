
describe 'yaml'
  before
    assert = function(path, expected) {
      yaml.eval(fixture(path + '.yml')).should.eql expected
    }
  end
  
  describe '.version'
    it 'should be a triplet'
      yaml.version.should.match(/^\d+\.\d+\.\d+$/)
    end
  end
  
  describe 'lexer'
    describe 'indentation'
      it 'should work'
        var tokens = yaml.tokenize('\n  1\n  2\n    3\n      4\n')
        tokens[0][0].should.eql 'indent'
        tokens[1][0].should.eql 'int'
        tokens[2][0].should.eql 'int'
        tokens[3][0].should.eql 'indent'
        tokens[4][0].should.eql 'int'
        tokens[5][0].should.eql 'indent'
        tokens[6][0].should.eql 'int'
        tokens[7][0].should.eql 'dedent'
        tokens[8][0].should.eql 'dedent'
        tokens[9][0].should.eql 'dedent'
      end
    end
  end
  
  describe 'int'
    it 'should convert to a number'
      yaml.eval('1').should.equal 1
    end
  end
  
  describe 'float'
    it 'should convert to a number'
      yaml.eval('1.5').should.equal 1.5
    end
  end
  
  describe '"string"'
    it 'should convert to a string'
      yaml.eval('"foo"').should.eql 'foo'
      yaml.eval("'foo'").should.eql 'foo'
    end
  end
  
  describe 'bools'
    describe 'true'
      it 'true'
        yaml.eval('true').should.equal true
      end
      
      it 'yes'
        yaml.eval('yes').should.equal true
      end
      
      it 'on'
        yaml.eval('on').should.equal true
      end
      
      it 'enabled'
        yaml.eval('enabled').should.equal true
      end
    end
    
    describe 'false'
      it 'false'
        yaml.eval('false').should.equal false
      end
      
      it 'no'
        yaml.eval('no').should.equal false
      end
      
      it 'off'
        yaml.eval('off').should.equal false
      end
      
      it 'disabled'
        yaml.eval('disabled').should.equal false
      end
    end
  end
  
  describe 'indentation'
    describe 'when invalid'
      it 'should throw an error'
        -{ yaml.eval(fixture('list.invalid.yml')) }.should.throw_error 'invalid indentation, got 3 instead of 2'
      end
    end
  end
  
  describe 'comments'
    it 'should work'
      assert('comments', [1,2,3])
    end
  end
  
  describe 'list'
    it 'should work'
      assert('list', [1,2,3])  
    end
    
    it 'should work with arbitrary text'
      assert('hash.text', {
        user: {
          name: 'tj',
          date: '1987-05-25',
          position: 'web developer and ceo of Vision Media'
        }
      })
    end
    
    describe 'inline'
      it 'should work'
        assert('list.inline', ['tj', 23])
      end
      
      it 'should work when empty'
        yaml.eval('[]').should.eql []
      end
      
      it 'should fail when comma is missing'
        -{ assert('list.inline.invalid') }.should.throw_error 'expected comma, near "1]"'
      end
    end
    
    describe 'with nested hash'
      it 'should work'
        assert('list.hash', [{ name: 'tj' }, { name: 'simon' }])
      end
    end
    
    describe 'with nested list'
      it 'should work'
        assert('list.list', [[1,2,3,[4,5]]])
      end
    end
    
    describe 'with nested lists'
      it 'should work'
        assert('list.lists', [1, [2, [3]], 4])
      end
    end
  end
  
  describe 'hash'
    it 'should work'
      assert('hash', { a: 1, b: 2 })
    end
    
    describe 'keys'
      it 'should allow words'
        yaml.eval('foo: "bar"').should.eql { foo: 'bar' }
      end
      
      it 'should allow underscores'
        yaml.eval('user_name: "tj"').should.eql { user_name: 'tj' }
      end
      
      it 'should allow spaces'
        yaml.eval('user name: "tj"').should.eql { 'user name': 'tj' }
      end
    end
    
    describe 'inline'
      it 'should work'
        assert('hash.inline', { name: 'tj', email: 'tj@vision-media.ca' })
      end
      
      it 'should ignore whitespace'
        assert('hash.inline.whitespace', { tj: { name: 'tj', age: 23 }})
      end
      
      it 'should work when empty'
        yaml.eval('{}').should.eql {}
      end
      
      describe 'keys'
        it 'should allow words'
          yaml.eval('{ foo: "bar" }').should.eql { foo: 'bar' }
        end

        it 'should allow underscores'
          yaml.eval('{ user_name: "tj" }').should.eql { user_name: 'tj' }
        end

        it 'should allow spaces'
          yaml.eval('{ user name: "tj" }').should.eql { 'user name': 'tj' }
        end
      end
      
      it 'should fail when comma is missing'
        -{ assert('hash.inline.invalid') }.should.throw_error(/expected comma, near "email: /)
      end
    end
    
    describe 'with nested list'
      it 'should work'
        assert('hash.list', { pets: ['niko', 'simon'] })
      end
    end
    
    describe 'with nested hash'
      it 'should work'
        assert('hash.hash', { pets: { niko: 2, simon: 14 }, birthMonths: { niko: "May", simon: "June" }})
      end
    end
  end
  
  describe 'documents'
    it 'should work'
      assert('document', [1,2,3])
    end
  end

end